import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { prisma } from "@/prisma/client";
import { logger } from "@/lib/logger";
import { createAuditLog } from "@/prisma/audit-log";
import { invalidateOnProductChange } from "@/lib/cache";

/**
 * POST /api/operations/transfers
 * Execute an internal stock transfer
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = body;

    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json({ error: "Source and destination warehouses must be different" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Decrease from source
      const sourceAllocation = await tx.stockAllocation.findFirst({
        where: { productId, warehouseId: fromWarehouseId }
      });

      if (!sourceAllocation || Number(sourceAllocation.quantity) < quantity) {
        throw new Error("Insufficient stock in source warehouse");
      }

      await tx.stockAllocation.update({
        where: { id: sourceAllocation.id },
        data: { quantity: { decrement: quantity } }
      });

      // 2. Increase in destination
      const destAllocation = await tx.stockAllocation.findFirst({
        where: { productId, warehouseId: toWarehouseId }
      });

      if (destAllocation) {
        await tx.stockAllocation.update({
          where: { id: destAllocation.id },
          data: { quantity: { increment: quantity } }
        });
      } else {
        await tx.stockAllocation.create({
          data: {
            productId,
            warehouseId: toWarehouseId,
            quantity: quantity,
            userId: session.id
          }
        });
      }

      await tx.stockTransfer.create({
        data: {
          productId,
          fromWarehouseId,
          toWarehouseId,
          quantity: quantity,
          status: "completed",
          notes,
          userId: session.id,
          completedAt: new Date()
        }
      });
    });

    createAuditLog({
      userId: session.id,
      action: "transfer",
      entityType: "product",
      entityId: productId,
      details: { quantity, fromWarehouseId, toWarehouseId },
    }).catch(() => {});

    await invalidateOnProductChange().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Error transferring stock:", error);
    return NextResponse.json({ error: error.message || "Failed to transfer stock" }, { status: 500 });
  }
}

/**
 * GET /api/operations/transfers
 * List all transfers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const transfers = await prisma.stockTransfer.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(transfers);
  } catch (error) {
    logger.error("Error fetching transfers:", error);
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}
