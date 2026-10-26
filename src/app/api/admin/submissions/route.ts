import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access Denied: Administrator role required" }, { status: 403 });
    }
    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
        problem: { select: { id: true, title: true, difficulty: true, level: { select: { number: true } } } },
      },
    });

    const totalSubmissions = await prisma.submission.count();
    const acceptedSubmissions = await prisma.submission.count({ where: { status: "ACCEPTED" } });
    const wrongAnswerSubmissions = await prisma.submission.count({ where: { status: "WRONG_ANSWER" } });
    const runtimeErrorSubmissions = await prisma.submission.count({ where: { status: "RUNTIME_ERROR" } });

    return NextResponse.json({
      submissions,
      stats: {
        total: totalSubmissions,
        accepted: acceptedSubmissions,
        wrongAnswer: wrongAnswerSubmissions,
        runtimeError: runtimeErrorSubmissions,
        acceptanceRate: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Admin submissions error:", error);
    return NextResponse.json({ error: "Failed to fetch admin submissions" }, { status: 500 });
  }
}
