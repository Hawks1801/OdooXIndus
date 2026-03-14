import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { createAuditLog } from "@/prisma/audit-log";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const suppliers = await prisma.supplier.findMany({
      where: { userId: session.id },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    logger.error("Error fetching suppliers:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, status, description } = body;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        userId: session.id,
        status: status !== undefined ? Boolean(status) : true,
        description: description || null,
      },
    });

    createAuditLog({
      userId: session.id,
      action: "create",
      entityType: "supplier",
      entityId: supplier.id,
      details: { name: supplier.name },
    }).catch(() => {});

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    logger.error("Error creating supplier:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
