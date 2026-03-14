import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { prisma } from "@/prisma/client";
import { logger } from "@/lib/logger";
import { createAuditLog } from "@/prisma/audit-log";
import { invalidateOnProductChange } from "@/lib/cache";

/**
 * POST /api/operations/adjustments
 * Adjust stock manually
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { productId, warehouseId, adjustedQty, reason } = body;

    if (!productId || !warehouseId || adjustedQty === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const previousQty = Number(product.quantity);
    const difference = adjustedQty - previousQty;

    await prisma.$transaction(async (tx) => {
      // 1. Update Product global quantity
      await tx.product.update({
        where: { id: productId },
        data: { quantity: adjustedQty }
      });

      // 2. Update or create StockAllocation
      const existingAllocation = await tx.stockAllocation.findFirst({
        where: { productId, warehouseId }
      });

      if (existingAllocation) {
        await tx.stockAllocation.update({
          where: { id: existingAllocation.id },
          data: { quantity: { increment: difference } }
        });
      } else {
        await tx.stockAllocation.create({
          data: {
            productId,
            warehouseId,
            quantity: adjustedQty,
            userId: session.id
          }
        });
      }

      // 3. Create adjustment record
      await tx.stockAdjustment.create({
        data: {
          productId,
          warehouseId,
          previousQty,
          adjustedQty,
          difference,
          reason,
          userId: session.id
        }
      });
    });

    createAuditLog({
      userId: session.id,
      action: "adjust",
      entityType: "product",
      entityId: productId,
      details: { productName: product.name, difference, reason },
    }).catch(() => {});

    await invalidateOnProductChange().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error adjusting stock:", error);
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 });
  }
}

/**
 * GET /api/operations/adjustments
 * List all adjustments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adjustments = await prisma.stockAdjustment.findMany({
      where: { userId: session.id },
      include: { product: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(adjustments);
  } catch (error) {
    logger.error("Error fetching adjustments:", error);
    return NextResponse.json({ error: "Failed to fetch adjustments" }, { status: 500 });
  }
}
