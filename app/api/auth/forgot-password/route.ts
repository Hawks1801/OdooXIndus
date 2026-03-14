import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/forgot-password
 * "Simple Reset" logic:
 * - If only email is provided: check if user exists.
 * - If email and newPassword are provided: update user password in DB.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
    }

    // Step 1: Just checking email exists (for step-based UI)
    if (!newPassword) {
      return NextResponse.json({ 
        message: "Email verified. Please set your new password.",
        userExists: true 
      }, { status: 200 });
    }

    // Step 2: Updating password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    logger.info(`Password updated successfully for user: ${email}`);
    
    return NextResponse.json({ 
      message: "Password updated successfully!" 
    }, { status: 200 });

  } catch (error) {
    logger.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
