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

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive integer" }, { status: 400 });
    }

    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json({ error: "Source and destination warehouses must be different" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Decrease from source
      const sourceAllocation = await tx.stockAllocation.findUnique({
        where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } }
      });

      if (!sourceAllocation || sourceAllocation.quantity < qty) {
        throw new Error("Insufficient stock in source warehouse");
      }

      await tx.stockAllocation.update({
        where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
        data: { quantity: { decrement: qty } }
      });

      // 2. Increase in destination
      await tx.stockAllocation.upsert({
        where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
        update: { quantity: { increment: qty } },
        create: {
          productId,
          warehouseId: toWarehouseId,
          quantity: qty,
          userId: session.id,
        }
      });

      // 3. Create transfer record
      await tx.stockTransfer.create({
        data: {
          productId,
          fromWarehouseId,
          toWarehouseId,
          quantity: qty,
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
      details: { quantity: qty, fromWarehouseId, toWarehouseId },
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
 * List all transfers with product and warehouse details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const transfers = await prisma.stockTransfer.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" }
    });

    // Collect unique productIds and warehouseIds in a single pass
    const productIdSet = new Set<string>();
    const warehouseIdSet = new Set<string>();
    for (const t of transfers) {
      productIdSet.add(t.productId);
      warehouseIdSet.add(t.fromWarehouseId);
      warehouseIdSet.add(t.toWarehouseId);
    }

    const [products, warehouses] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: [...productIdSet] } },
        select: { id: true, name: true, sku: true },
      }),
      prisma.warehouse.findMany({
        where: { id: { in: [...warehouseIdSet] } },
        select: { id: true, name: true },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

    const enriched = transfers.map((t) => ({
      ...t,
      quantity: Number(t.quantity),
      productName: productMap.get(t.productId)?.name ?? t.productId,
      productSku: productMap.get(t.productId)?.sku ?? null,
      fromWarehouseName: warehouseMap.get(t.fromWarehouseId)?.name ?? t.fromWarehouseId,
      toWarehouseName: warehouseMap.get(t.toWarehouseId)?.name ?? t.toWarehouseId,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    logger.error("Error fetching transfers:", error);
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}
