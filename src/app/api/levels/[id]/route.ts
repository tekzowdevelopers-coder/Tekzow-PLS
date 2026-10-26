import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await getCurrentUser(req);
    const num = parseInt(id, 10);

    const level = await prisma.level.findFirst({
      where: isNaN(num) ? { id } : { OR: [{ id }, { number: num }] },
      include: {
        problems: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            orderIndex: true,
            title: true,
            difficulty: true,
            concept: true,
            objective: true,
            statement: true,
          },
        },
        assignment: true,
      },
    });

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Get student's problem progress
    let problemStatuses: Record<string, string> = {};
    if (user) {
      const progresses = await prisma.problemProgress.findMany({
        where: {
          userId: user.id,
          problemId: { in: level.problems.map((p) => p.id) },
        },
      });
      for (const prog of progresses) {
        problemStatuses[prog.problemId] = prog.status;
      }
    }

    const problemsWithProgress = level.problems.map((prob) => ({
      ...prob,
      status: problemStatuses[prob.id] || "NOT_ATTEMPTED",
    }));

    return NextResponse.json({
      level: {
        ...level,
        problems: problemsWithProgress,
      },
    });
  } catch (error) {
    console.error("Fetch level detail error:", error);
    return NextResponse.json({ error: "Failed to load level" }, { status: 500 });
  }
}
