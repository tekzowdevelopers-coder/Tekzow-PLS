import { prisma } from "../prisma";

export interface StudentProgressSummary {
  userId: string;
  totalAccepted: number;
  totalProblems: number;
  currentLevelNumber: number;
  completedLevelsCount: number;
  unlockedLevelsCount: number;
  levels: {
    levelId: string;
    number: number;
    title: string;
    status: "LOCKED" | "UNLOCKED" | "COMPLETED";
    acceptedCount: number;
    totalCount: number;
    isMilestone: boolean;
  }[];
}

export async function getUserProgress(userId: string): Promise<StudentProgressSummary> {
  const allLevels = await prisma.level.findMany({
    orderBy: { number: "asc" },
    include: {
      problems: {
        select: { id: true },
      },
      progress: {
        where: { userId },
      },
    },
  });

  const acceptedProblems = await prisma.problemProgress.findMany({
    where: {
      userId,
      status: "ACCEPTED",
    },
    select: { problemId: true },
  });

  const acceptedSet = new Set(acceptedProblems.map((p) => p.problemId));

  let completedLevelsCount = 0;
  let unlockedLevelsCount = 0;
  let currentLevelNumber = 1;

  const levelSummaries = allLevels.map((lvl) => {
    const userLvlProg = lvl.progress[0];
    let status: "LOCKED" | "UNLOCKED" | "COMPLETED" = "LOCKED";

    if (userLvlProg) {
      status = userLvlProg.status as "LOCKED" | "UNLOCKED" | "COMPLETED";
    } else if (lvl.number === 1) {
      // Level 1 is always unlocked by default
      status = "UNLOCKED";
    }

    const acceptedInLevel = lvl.problems.filter((p) => acceptedSet.has(p.id)).length;
    const totalInLevel = lvl.problems.length;

    if (acceptedInLevel === totalInLevel && totalInLevel > 0) {
      status = "COMPLETED";
      completedLevelsCount++;
    } else if (status === "UNLOCKED") {
      unlockedLevelsCount++;
      if (currentLevelNumber === 1 || currentLevelNumber < lvl.number) {
        currentLevelNumber = lvl.number;
      }
    }

    return {
      levelId: lvl.id,
      number: lvl.number,
      title: lvl.title,
      status,
      acceptedCount: acceptedInLevel,
      totalCount: totalInLevel,
      isMilestone: lvl.isMilestone,
    };
  });

  // Calculate current active level
  const firstIncompleteUnlocked = levelSummaries.find(
    (l) => l.status === "UNLOCKED" || (l.status === "LOCKED" && l.number === 1)
  );
  if (firstIncompleteUnlocked) {
    currentLevelNumber = firstIncompleteUnlocked.number;
  }

  const totalProblems = allLevels.reduce((acc, l) => acc + l.problems.length, 0);

  return {
    userId,
    totalAccepted: acceptedSet.size,
    totalProblems,
    currentLevelNumber,
    completedLevelsCount,
    unlockedLevelsCount: Math.max(unlockedLevelsCount, 1),
    levels: levelSummaries,
  };
}

/**
 * Updates progress after an accepted submission.
 * Checks if current level has 5/5 accepted, marks completed, and unlocks next level.
 */
export async function handleAcceptedSubmission(userId: string, problemId: string) {
  // 1. Record/Update problem progress
  await prisma.problemProgress.upsert({
    where: {
      userId_problemId: {
        userId,
        problemId,
      },
    },
    update: {
      status: "ACCEPTED",
      completedAt: new Date(),
    },
    create: {
      userId,
      problemId,
      status: "ACCEPTED",
      attempts: 1,
      completedAt: new Date(),
    },
  });

  // 2. Fetch the level of this problem
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      level: {
        include: {
          problems: { select: { id: true } },
        },
      },
    },
  });

  if (!problem) return { levelCompleted: false, nextLevelUnlocked: null, acceptedInLevel: 0, totalInLevel: 0 };

  const level = problem.level;
  const levelProblemIds = level.problems.map((p) => p.id);

  // 3. Count accepted problems in this level
  const acceptedInLevel = await prisma.problemProgress.count({
    where: {
      userId,
      problemId: { in: levelProblemIds },
      status: "ACCEPTED",
    },
  });

  let levelCompleted = false;
  let nextLevelUnlocked: number | null = null;

  // If all problems in this level are accepted (e.g. 5/5)
  if (acceptedInLevel === levelProblemIds.length) {
    levelCompleted = true;

    // Mark current level as COMPLETED
    await prisma.levelProgress.upsert({
      where: {
        userId_levelId: {
          userId,
          levelId: level.id,
        },
      },
      update: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      create: {
        userId,
        levelId: level.id,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Find and UNLOCK next level (level.number + 1)
    const nextLevel = await prisma.level.findUnique({
      where: { number: level.number + 1 },
    });

    if (nextLevel) {
      await prisma.levelProgress.upsert({
        where: {
          userId_levelId: {
            userId,
            levelId: nextLevel.id,
          },
        },
        update: {
          status: "UNLOCKED",
        },
        create: {
          userId,
          levelId: nextLevel.id,
          status: "UNLOCKED",
        },
      });
      nextLevelUnlocked = nextLevel.number;
    }
  }

  return {
    levelCompleted,
    nextLevelUnlocked,
    acceptedInLevel,
    totalInLevel: levelProblemIds.length,
  };
}
