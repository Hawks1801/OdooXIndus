import { getCache, setCache, cacheKeys } from "@/lib/cache";
import {
  getOrdersByUser,
  getOrdersByClientId,
  getOrdersContainingSupplierProducts,
  getOrdersContainingProductOwnerProducts,
} from "@/prisma/order";
import { prisma } from "@/prisma/client";

export async function getOrdersForUser(userId: string) {
  const cacheKey = cacheKeys.orders.list({ userId });
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const orders = await getOrdersByUser(userId);
  const transformed = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt?.toISOString() || null,
    items: order.items.map((item: any) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  }));

  await setCache(cacheKey, transformed, 300);
  return transformed;
}

export async function getClientOrdersForProductOwner(productOwnerUserId: string) {
  const cacheKey = cacheKeys.orders.list({ productOwnerId: productOwnerUserId });
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const orders = await getOrdersContainingProductOwnerProducts(productOwnerUserId);
  const transformed = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt?.toISOString() || null,
    items: order.items.map((item: any) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  }));

  await setCache(cacheKey, transformed, 300);
  return transformed;
}
