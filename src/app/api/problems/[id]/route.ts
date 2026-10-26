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

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        level: {
          select: {
            id: true,
            number: true,
            title: true,
            isMilestone: true,
          },
        },
        // EXCLUSIVELY fetch VISIBLE test cases for workspace display!
        testCases: {
          where: { type: "VISIBLE", isActive: true },
          select: {
            id: true,
            type: true,
            inputData: true,
            expectedOutput: true,
          },
        },
        hints: {
          orderBy: { sequence: "asc" },
          select: {
            id: true,
            sequence: true,
            content: true,
          },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required to access workspace" }, { status: 401 });
    }

    // Level unlock check: students cannot access problems from locked levels
    if (user.role !== "ADMIN" && problem.level.number > 1) {
      const levelProg = await prisma.levelProgress.findUnique({
        where: {
          userId_levelId: {
            userId: user.id,
            levelId: problem.level.id,
          },
        },
      });

      if (!levelProg || levelProg.status === "LOCKED") {
        return NextResponse.json(
          {
            error: `Level ${problem.level.number} is locked. You must complete all problems in Level ${problem.level.number - 1} first.`,
            isLocked: true,
            requiredLevel: problem.level.number - 1,
          },
          { status: 403 }
        );
      }
    }

    // Get user's latest submission and status
    let userStatus = "NOT_ATTEMPTED";
    let lastCode = problem.starterCode || "";
    let attemptsCount = 0;

    const progress = await prisma.problemProgress.findUnique({
      where: {
        userId_problemId: {
          userId: user.id,
          problemId: problem.id,
        },
      },
    });

      if (progress) {
        userStatus = progress.status;
        attemptsCount = progress.attempts;
      }

      const lastSubmission = await prisma.submission.findFirst({
        where: {
          userId: user.id,
          problemId: problem.id,
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastSubmission) {
        lastCode = lastSubmission.code;
      }

    return NextResponse.json({
      problem: {
        id: problem.id,
        orderIndex: problem.orderIndex,
        title: problem.title,
        difficulty: problem.difficulty,
        concept: problem.concept,
        objective: problem.objective,
        statement: problem.statement,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints,
        starterCode: problem.starterCode,
        timeLimitMs: problem.timeLimitMs,
        level: problem.level,
        visibleTests: problem.testCases,
        hints: problem.hints,
        userStatus,
        lastCode,
        attemptsCount,
      },
    });
  } catch (error) {
    console.error("Fetch problem error:", error);
    return NextResponse.json({ error: "Failed to load problem" }, { status: 500 });
  }
}
