import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";

/**
 * POST /api/auth/register
 * Register a new user (Cleaned for SQLite/Prisma)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod schema
    const { name, email, password } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user via Prisma
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin", // Default to admin for hackathon power
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const { invalidateAllServerCaches } = await import("@/lib/cache");
    await invalidateAllServerCaches().catch(() => {});

    return NextResponse.json(
      {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid registration data. Please check your inputs." },
        { status: 400 }
      );
    }

    logger.error("Registration error:", error);

    return NextResponse.json(
      { error: `Registration failed` },
      { status: 500 }
    );
  }
}
