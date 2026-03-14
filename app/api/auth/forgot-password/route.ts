import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/forgot-password
 * Simple placeholder for forgot password functionality.
 * In a real app, this would generate a reset token and send an email.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists (optional, depends on if you want to leak email existence)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    // In a real flow, you'd send an actual email here if user exists
    logger.info(`Password reset requested for: ${email}`);
    
    return NextResponse.json({ 
      message: "If an account exists for this email, a reset link has been sent." 
    }, { status: 200 });
  } catch (error) {
    logger.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
