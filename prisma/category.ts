import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";

export const createCategory = async (data: { name: string; userId: string }) => {
  return prisma.category.create({
    data: {
      name: data.name,
      userId: data.userId,
    },
  });
};

export const getCategoriesByUser = async (userId: string) => {
  return prisma.category.findMany({ where: { userId } });
};

export const getCategoryById = async (categoryId: string, userId: string) => {
  return prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
};

export const updateCategory = async (id: string, data: { name?: string }) => {
  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      updatedAt: new Date(),
    },
  });
};

export const deleteCategory = async (id: string) => {
  return prisma.category.delete({ where: { id } });
};
