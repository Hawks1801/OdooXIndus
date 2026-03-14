import { prisma } from "@/prisma/client";
import type { CreateInvoiceInput, InvoiceFilters } from "@/types/invoice";

export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${timePart}-${randomPart}`;
}

export async function createInvoice(data: CreateInvoiceInput, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
  });

  if (!order) throw new Error("Order not found");

  const invoiceNumber = await generateInvoiceNumber();

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId: data.orderId,
      userId,
      clientId: order.clientId,
      status: "draft",
      subtotal: order.total,
      total: order.total,
      amountPaid: 0,
      amountDue: order.total,
      dueDate: new Date(data.dueDate),
      issuedAt: new Date(),
    },
  });
}

export async function getInvoicesByUser(userId: string, filters?: InvoiceFilters) {
  return prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoicesByClientId(clientId: string, filters?: InvoiceFilters) {
  return prisma.invoice.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * RESTORED: Get invoices by order IDs
 */
export async function getInvoicesByOrderIds(orderIds: string[]) {
  if (orderIds.length === 0) return [];
  return prisma.invoice.findMany({
    where: { orderId: { in: orderIds } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * RESTORED: Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string, userId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
}
