import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { prisma } from "@/prisma/client";
import { logger } from "@/lib/logger";
import { createAuditLog } from "@/prisma/audit-log";
import { invalidateOnProductChange } from "@/lib/cache";

/**
 * POST /api/operations/receipts/[id]/validate
 * Validate a receipt and increase stock
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!receipt) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    if (receipt.status === "done") return NextResponse.json({ error: "Receipt already validated" }, { status: 400 });

    // Use transaction to ensure all stock is updated
    await prisma.$transaction(async (tx) => {
      for (const item of receipt.items) {
        // 1. Increase Product global quantity
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity }
          }
        });

        // 2. Increase or create StockAllocation in the warehouse
        const existingAllocation = await tx.stockAllocation.findFirst({
          where: {
            productId: item.productId,
            warehouseId: receipt.warehouseId
          }
        });

        if (existingAllocation) {
          await tx.stockAllocation.update({
            where: { id: existingAllocation.id },
            data: {
              quantity: { increment: item.quantity }
            }
          });
        } else {
          await tx.stockAllocation.create({
            data: {
              productId: item.productId,
              warehouseId: receipt.warehouseId,
              quantity: item.quantity,
              userId: session.id
            }
          });
        }
      }

      // 3. Update receipt status
      await tx.receipt.update({
        where: { id },
        data: {
          status: "done",
          validatedAt: new Date(),
          updatedAt: new Date()
        }
      });
    });

    createAuditLog({
      userId: session.id,
      action: "validate",
      entityType: "receipt",
      entityId: id,
      details: { receiptNumber: receipt.receiptNumber },
    }).catch(() => {});

    await invalidateOnProductChange().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error validating receipt:", error);
    return NextResponse.json({ error: "Failed to validate receipt" }, { status: 500 });
  }
}
