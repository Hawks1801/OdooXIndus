import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { createAuditLog } from "@/prisma/audit-log";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categories = await prisma.category.findMany({
      where: { userId: session.id },
    });

    return NextResponse.json(categories);
  } catch (error) {
    logger.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, status, description } = body;

    const category = await prisma.category.create({
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
      entityType: "category",
      entityId: category.id,
      details: JSON.stringify({ name: category.name }),
    }).catch(() => {});

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    logger.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
