import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserProgress } from "@/lib/progress/unlock-engine";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const userId = user?.id;

    if (userId) {
      const progress = await getUserProgress(userId);
      return NextResponse.json({
        levels: progress.levels,
        summary: {
          totalAccepted: progress.totalAccepted,
          totalProblems: progress.totalProblems,
          currentLevelNumber: progress.currentLevelNumber,
          completedLevelsCount: progress.completedLevelsCount,
        },
      });
    }

    // Fallback: list levels directly
    const levels = await prisma.level.findMany({
      orderBy: { number: "asc" },
      include: {
        _count: { select: { problems: true } },
      },
    });

    return NextResponse.json({
      levels: levels.map((lvl) => ({
        levelId: lvl.id,
        number: lvl.number,
        title: lvl.title,
        description: lvl.description,
        objective: lvl.objective,
        isMilestone: lvl.isMilestone,
        status: lvl.number === 1 ? "UNLOCKED" : "LOCKED",
        acceptedCount: 0,
        totalCount: lvl._count.problems,
      })),
    });
  } catch (error) {
    console.error("Fetch levels error:", error);
    return NextResponse.json({ error: "Failed to load levels" }, { status: 500 });
  }
}
