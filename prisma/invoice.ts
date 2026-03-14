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
 * Get invoices by order IDs
 */
export async function getInvoicesByOrderIds(orderIds: string[]) {
  if (orderIds.length === 0) return [];
  return prisma.invoice.findMany({
    where: { orderId: { in: orderIds } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string, userId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
}

/**
 * Get invoice by ID for a product owner (admin viewing a client invoice).
 * Returns the invoice if any order item belongs to a product owned by this user.
 */
export async function getInvoiceByIdForProductOwner(
  invoiceId: string,
  productOwnerUserId: string,
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: { select: { userId: true } },
            },
          },
        },
      },
    },
  });
  if (!invoice) return null;
  const hasMyProduct = invoice.order?.items?.some(
    (item) => item.product.userId === productOwnerUserId,
  );
  return hasMyProduct ? invoice : null;
}

/**
 * Update an invoice
 */
export async function updateInvoice(invoiceId: string, data: any) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      ...(data.status != null && { status: data.status }),
      ...(data.amountPaid != null && { amountPaid: data.amountPaid }),
      ...(data.amountDue != null && { amountDue: data.amountDue }),
      ...(data.dueDate != null && { dueDate: new Date(data.dueDate) }),
      ...(data.cancelledAt != null && { cancelledAt: data.cancelledAt }),
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(invoiceId: string) {
  return prisma.invoice.delete({ where: { id: invoiceId } });
}

/**
 * Mark invoice as sent
 */
export async function markInvoiceAsSent(invoiceId: string) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "sent",
      updatedAt: new Date(),
    },
  });
}

/**
 * Create invoice for a paid order if one does not exist yet
 */
export async function ensureInvoiceForPaidOrder(orderId: string, userId: string) {
  const existing = await prisma.invoice.findUnique({
    where: { orderId },
  });
  if (existing) return existing;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) throw new Error("Order not found");

  const invoiceNumber = await generateInvoiceNumber();
  return prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId,
      userId,
      clientId: order.clientId,
      status: "paid",
      subtotal: order.total,
      total: order.total,
      amountPaid: order.total,
      amountDue: 0,
      dueDate: new Date(),
      issuedAt: new Date(),
    },
  });
}
