import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserProgress } from "@/lib/progress/unlock-engine";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = user.id;

    const progress = await getUserProgress(userId);

    // Fetch recent submissions
    const recentSubmissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        problem: {
          select: { id: true, title: true, level: { select: { number: true } } },
        },
      },
    });

    return NextResponse.json({
      progress,
      recentSubmissions,
    });
  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
