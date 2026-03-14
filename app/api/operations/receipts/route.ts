import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { prisma } from "@/prisma/client";
import { logger } from "@/lib/logger";
import { createAuditLog } from "@/prisma/audit-log";
import { invalidateOnProductChange } from "@/lib/cache";

/**
 * GET /api/operations/receipts
 * List all receipts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const receipts = await prisma.receipt.findMany({
      where: { userId: session.id },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(receipts);
  } catch (error) {
    logger.error("Error fetching receipts:", error);
    return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 });
  }
}

/**
 * POST /api/operations/receipts
 * Create a new receipt (draft)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { supplierId, warehouseId, notes, items } = body;

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber: `RCP-${Date.now()}`,
        supplierId,
        warehouseId,
        notes,
        userId: session.id,
        status: "draft",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        }
      }
    });

    createAuditLog({
      userId: session.id,
      action: "create",
      entityType: "receipt",
      entityId: receipt.id,
      details: { receiptNumber: receipt.receiptNumber },
    }).catch(() => {});

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    logger.error("Error creating receipt:", error);
    return NextResponse.json({ error: "Failed to create receipt" }, { status: 500 });
  }
}
