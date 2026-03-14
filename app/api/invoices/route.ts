import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { createInvoice, getInvoicesByUser, getInvoicesByClientId } from "@/prisma/invoice";
import { prisma } from "@/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.id;
    const isClient = session.role === "client";

    const invoices = isClient
      ? await getInvoicesByClientId(userId)
      : await getInvoicesByUser(userId);

    const transformedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      userId: invoice.userId,
      clientId: invoice.clientId,
      status: invoice.status,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      dueDate: invoice.dueDate.toISOString(),
      issuedAt: invoice.issuedAt.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedInvoices);
  } catch (error) {
    logger.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const invoice = await createInvoice(body, session.id);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    logger.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
