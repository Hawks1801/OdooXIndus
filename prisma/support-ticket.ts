import { prisma } from "@/prisma/client";

export async function generateTicketId(): Promise<string> {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `TK-${randomPart}`;
}

export async function createSupportTicket(data: any, userId?: string) {
  const ticketId = await generateTicketId();
  const resolvedUserId = userId ?? data.userId;
  return prisma.supportTicket.create({
    data: {
      ticketId,
      userId: resolvedUserId,
      subject: data.subject,
      description: data.description,
      status: data.status || "open",
      priority: data.priority || "medium",
      category: data.category || "general",
      assignedToId: data.assignedToId ?? null,
      productId: data.productId ?? null,
      orderId: data.orderId ?? null,
      supplierId: data.supplierId ?? null,
    },
  });
}

export async function getSupportTicketsByUserId(userId: string) {
  return prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSupportTicketsByAssignedTo(assignedToId: string) {
  return prisma.supportTicket.findMany({
    where: { assignedToId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllSupportTickets() {
  return prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updateSupportTicketStatus(id: string, status: string) {
  return prisma.supportTicket.update({
    where: { id },
    data: { status },
  });
}

export async function getSupportTicketById(id: string) {
  return prisma.supportTicket.findUnique({
    where: { id },
  });
}

export async function updateSupportTicket(id: string, data: any) {
  return prisma.supportTicket.update({
    where: { id },
    data: {
      ...(data.status != null && { status: data.status }),
      ...(data.priority != null && { priority: data.priority }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      ...(data.notes !== undefined && { notes: data.notes }),
      updatedAt: new Date(),
    },
  });
}

export async function deleteSupportTicket(id: string) {
  // Delete replies first, then the ticket
  await prisma.supportTicketReply.deleteMany({ where: { ticketId: id } });
  return prisma.supportTicket.delete({ where: { id } });
}

export async function getSupportTicketReplies(ticketId: string) {
  return prisma.supportTicketReply.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createSupportTicketReply(
  ticketId: string,
  userId: string,
  body: string,
) {
  return prisma.supportTicketReply.create({
    data: {
      ticketId,
      userId,
      body,
    },
  });
}
