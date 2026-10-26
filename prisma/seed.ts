import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CURRICULUM } from "./curriculumData";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed Users (Student and Admin)
  const studentPassword = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      name: "Demo Student",
      email: "student@example.com",
      passwordHash: studentPassword,
      role: "STUDENT",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@example.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  console.log(`👤 Users seeded: ${student.email}, ${admin.email}`);

  // 2. Seed Levels, Problems, Test Cases, and Hints
  let totalProblems = 0;
  let totalTests = 0;

  for (const lvl of CURRICULUM) {
    const levelRecord = await prisma.level.upsert({
      where: { number: lvl.number },
      update: {
        title: lvl.title,
        description: lvl.description,
        objective: lvl.objective,
        isMilestone: lvl.isMilestone,
      },
      create: {
        number: lvl.number,
        title: lvl.title,
        description: lvl.description,
        objective: lvl.objective,
        isMilestone: lvl.isMilestone,
      },
    });

    // Milestone assignment
    if (lvl.assignment) {
      await prisma.milestoneAssignment.upsert({
        where: { levelId: levelRecord.id },
        update: {
          title: lvl.assignment.title,
          instructions: lvl.assignment.instructions,
          passRule: lvl.assignment.passRule,
        },
        create: {
          levelId: levelRecord.id,
          title: lvl.assignment.title,
          instructions: lvl.assignment.instructions,
          passRule: lvl.assignment.passRule,
        },
      });
    }

    // Problems
    for (const prob of lvl.problems) {
      const problemRecord = await prisma.problem.upsert({
        where: { id: prob.id },
        update: {
          levelId: levelRecord.id,
          orderIndex: prob.orderIndex,
          title: prob.title,
          difficulty: prob.difficulty,
          concept: prob.concept,
          objective: prob.objective,
          statement: prob.statement,
          inputFormat: prob.inputFormat,
          outputFormat: prob.outputFormat,
          constraints: prob.constraints,
          starterCode: prob.starterCode,
          solutionDoc: prob.solutionDoc,
        },
        create: {
          id: prob.id,
          levelId: levelRecord.id,
          orderIndex: prob.orderIndex,
          title: prob.title,
          difficulty: prob.difficulty,
          concept: prob.concept,
          objective: prob.objective,
          statement: prob.statement,
          inputFormat: prob.inputFormat,
          outputFormat: prob.outputFormat,
          constraints: prob.constraints,
          starterCode: prob.starterCode,
          solutionDoc: prob.solutionDoc,
        },
      });

      totalProblems++;

      // Delete old tests and re-insert
      await prisma.testCase.deleteMany({ where: { problemId: problemRecord.id } });

      // Visible tests
      for (const vt of prob.visibleTests) {
        await prisma.testCase.create({
          data: {
            problemId: problemRecord.id,
            type: "VISIBLE",
            inputData: vt.input,
            expectedOutput: vt.expected,
          },
        });
        totalTests++;
      }

      // Hidden tests
      for (const ht of prob.hiddenTests) {
        await prisma.testCase.create({
          data: {
            problemId: problemRecord.id,
            type: "HIDDEN",
            inputData: ht.input,
            expectedOutput: ht.expected,
          },
        });
        totalTests++;
      }

      // Hints
      await prisma.hint.deleteMany({ where: { problemId: problemRecord.id } });
      for (let i = 0; i < prob.hints.length; i++) {
        await prisma.hint.create({
          data: {
            problemId: problemRecord.id,
            sequence: i + 1,
            content: prob.hints[i],
          },
        });
      }
    }

    // Initialize Level 1 as UNLOCKED for the demo student
    if (lvl.number === 1) {
      await prisma.levelProgress.upsert({
        where: {
          userId_levelId: {
            userId: student.id,
            levelId: levelRecord.id,
          },
        },
        update: { status: "UNLOCKED" },
        create: {
          userId: student.id,
          levelId: levelRecord.id,
          status: "UNLOCKED",
        },
      });
    }
  }

  console.log(`✅ Seeded ${CURRICULUM.length} levels, ${totalProblems} problems, and ${totalTests} test cases.`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
