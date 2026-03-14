import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";

const DEMO_SUPPLIER_EMAIL = "test@supplier.com";

export async function getDemoSupplierUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_SUPPLIER_EMAIL },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function getSuppliersForAdminIncludingDemo(userId: string) {
  const demoUserId = await getDemoSupplierUserId();
  const where = demoUserId != null ? { OR: [{ userId }, { userId: demoUserId }] } : { userId };
  return prisma.supplier.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

export const createSupplier = async (data: { name: string; userId: string }) => {
  return prisma.supplier.create({
    data: {
      name: data.name,
      userId: data.userId,
    },
  });
};

export const getSuppliersByUser = async (userId: string) => {
  return prisma.supplier.findMany({ where: { userId } });
};

export async function getSupplierByUserId(userId: string) {
  return prisma.supplier.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });
}

export const updateSupplier = async (id: string, data: { name?: string }) => {
  return prisma.supplier.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      updatedAt: new Date(),
    },
  });
};

export const deleteSupplier = async (id: string) => {
  return prisma.supplier.delete({ where: { id } });
};

export async function getSupplierById(supplierId: string, userId?: string) {
  return prisma.supplier.findFirst({
    where: {
      id: supplierId,
      ...(userId && { userId }),
    },
  });
}
