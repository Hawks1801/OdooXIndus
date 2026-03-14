import { getCache, setCache, cacheKeys } from "@/lib/cache";
import {
  getOrdersByUser,
  getOrdersByClientId,
  getOrdersContainingSupplierProducts,
  getOrdersContainingProductOwnerProducts,
} from "@/prisma/order";
import { prisma } from "@/prisma/client";

/** Serialised order shape returned by getOrdersFor* helpers (dates as ISO strings). */
export type OrderForPage = ReturnType<typeof transformOrder> extends Promise<infer T> ? T : ReturnType<typeof transformOrder>;

/**
 * Transforms order dates to ISO strings for React Server Components
 */
function transformOrder(order: any) {
  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt?.toISOString() || null,
    items: order.items.map((item: any) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export async function getOrdersForUser(userId: string) {
  const cacheKey = cacheKeys.orders.list({ userId });
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const orders = await getOrdersByUser(userId);
  const transformed = orders.map(transformOrder);

  await setCache(cacheKey, transformed, 300);
  return transformed;
}

export async function getClientOrdersForProductOwner(productOwnerUserId: string) {
  const cacheKey = cacheKeys.orders.list({ productOwnerId: productOwnerUserId });
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const orders = await getOrdersContainingProductOwnerProducts(productOwnerUserId);
  const transformed = orders.map(transformOrder);

  await setCache(cacheKey, transformed, 300);
  return transformed;
}

/**
 * RESTORED: Fetch orders for a client
 */
export async function getOrdersForClientId(clientId: string) {
  const cacheKey = cacheKeys.orders.list({ userId: clientId, byClient: true });
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const orders = await getOrdersByClientId(clientId);
  const transformed = orders.map(transformOrder);

  await setCache(cacheKey, transformed, 300);
  return transformed;
}

/**
 * RESTORED: Fetch orders for a supplier
 */
export async function getOrdersForSupplierId(supplierId: string) {
  const cacheKey = cacheKeys.orders.list({ supplierId });
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const orders = await getOrdersContainingSupplierProducts(supplierId);
  const transformed = orders.map(transformOrder);

  await setCache(cacheKey, transformed, 300);
  return transformed;
}
