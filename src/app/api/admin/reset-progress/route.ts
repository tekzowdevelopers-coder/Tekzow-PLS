import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const caller = await getCurrentUser(req);
    if (!caller || caller.role !== "ADMIN") {
      return NextResponse.json({ error: "Access Denied: Administrator role required" }, { status: 403 });
    }

    const { email = "student@example.com" } = await req.json().catch(() => ({}));

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete progress & submissions
    await prisma.problemProgress.deleteMany({ where: { userId: user.id } });
    await prisma.levelProgress.deleteMany({ where: { userId: user.id } });
    await prisma.submission.deleteMany({ where: { userId: user.id } });

    // Unlock Level 1 only
    const level1 = await prisma.level.findUnique({ where: { number: 1 } });
    if (level1) {
      await prisma.levelProgress.create({
        data: {
          userId: user.id,
          levelId: level1.id,
          status: "UNLOCKED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Progress reset for ${email}. Level 1 unlocked.`,
    });
  } catch (error) {
    console.error("Reset progress error:", error);
    return NextResponse.json({ error: "Failed to reset progress" }, { status: 500 });
  }
}
