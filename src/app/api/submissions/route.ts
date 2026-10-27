import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateSubmission } from "@/lib/evaluation/evaluator";
import { handleAcceptedSubmission } from "@/lib/progress/unlock-engine";
import { setRunnerBaseUrl } from "@/lib/execution/runner";

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get("host");
    if (host) {
      const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
      setRunnerBaseUrl(`${protocol}://${host}`);
    }

    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required. Please sign in to submit solutions." }, { status: 401 });
    }
    const userId = user.id;

    const { problemId, code } = await req.json();

    if (!problemId || code === undefined || code === null) {
      return NextResponse.json({ error: "Problem ID and code are required" }, { status: 400 });
    }

    // 1. Fetch problem & all test cases (both visible and hidden)
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        level: true,
        testCases: {
          where: { isActive: true },
          orderBy: { type: "desc" }, // Visible first, then hidden
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Verify level is not locked for this student
    if (user.role !== "ADMIN" && problem.level.number > 1) {
      const levelProg = await prisma.levelProgress.findUnique({
        where: {
          userId_levelId: {
            userId,
            levelId: problem.level.id,
          },
        },
      });

      if (!levelProg || levelProg.status === "LOCKED") {
        return NextResponse.json(
          { error: `Cannot submit: Level ${problem.level.number} is locked. Complete all problems in Level ${problem.level.number - 1} first.` },
          { status: 403 }
        );
      }
    }

    // 2. Evaluate solution against all test cases
    const evaluation = await evaluateSubmission(
      code,
      problem.testCases.map((tc) => ({
        id: tc.id,
        type: tc.type,
        inputData: tc.inputData,
        expectedOutput: tc.expectedOutput,
      })),
      problem.timeLimitMs
    );

    // 3. Record submission in database
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        status: evaluation.overallStatus,
        passedCount: evaluation.passedCount,
        totalCount: evaluation.totalCount,
        executionMs: evaluation.maxExecutionMs,
        errorMessage: evaluation.errorMessage,
      },
    });

    // 4. Update attempts count
    await prisma.problemProgress.upsert({
      where: {
        userId_problemId: { userId, problemId },
      },
      update: {
        attempts: { increment: 1 },
      },
      create: {
        userId,
        problemId,
        status: "ATTEMPTED",
        attempts: 1,
      },
    });

    // 5. Handle Level Unlock if accepted
    let unlockInfo = {
      levelCompleted: false,
      nextLevelUnlocked: null as number | null,
      acceptedInLevel: 0,
      totalInLevel: 5,
    };

    if (evaluation.overallStatus === "ACCEPTED") {
      unlockInfo = await handleAcceptedSubmission(userId, problemId);
    }

    return NextResponse.json({
      submissionId: submission.id,
      overallStatus: evaluation.overallStatus,
      passedCount: evaluation.passedCount,
      totalCount: evaluation.totalCount,
      maxExecutionMs: evaluation.maxExecutionMs,
      results: evaluation.results, // Hidden test inputs & expected outputs are NOT exposed
      errorMessage: evaluation.errorMessage,
      unlockInfo,
    });
  } catch (error: any) {
    console.error("Submission evaluation error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate submission" }, { status: 500 });
  }
}
