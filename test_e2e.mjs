// Automated End-to-End Verification Test Script for PyPractical Platform

async function runTests() {
  console.log("🚀 Starting End-to-End Verification Suite on http://localhost:3005...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = "") {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name} ${details}`);
      failed++;
    }
  }

  // 1. Check Homepage
  try {
    const homeRes = await fetch("http://localhost:3005/");
    assert(homeRes.status === 200, "Home page responds with HTTP 200");
  } catch (e) {
    assert(false, "Home page responds with HTTP 200", e.message);
  }

  // 2. Check Levels API
  let levelsData;
  try {
    const lvlRes = await fetch("http://localhost:3005/api/levels");
    levelsData = await lvlRes.json();
    assert(levelsData.levels && levelsData.levels.length === 20, "API returns exactly 20 levels");
    assert(levelsData.levels[0].number === 1 && levelsData.levels[0].status === "UNLOCKED", "Level 1 is initially UNLOCKED");
    assert(levelsData.levels[1].number === 2 && levelsData.levels[1].status === "LOCKED", "Level 2 is initially LOCKED");
  } catch (e) {
    assert(false, "Levels API verification", e.message);
  }

  // 3. Check Problem API & Secret Test Protection
  try {
    const probRes = await fetch("http://localhost:3005/api/problems/PY-L01-P01");
    const probData = await probRes.json();
    assert(probData.problem && probData.problem.title === "Hello Python", "Fetched PY-L01-P01 problem metadata");
    assert(probData.problem.visibleTests.length > 0, "Visible test cases exist");
    // Ensure no hidden test cases leaked
    const hasHidden = probData.problem.visibleTests.some(t => t.type === "HIDDEN");
    assert(!hasHidden, "Security Check: Hidden test cases are completely excluded from client payload");
  } catch (e) {
    assert(false, "Problem API verification", e.message);
  }

  // 4. Test Code Run (Execution Sandbox)
  try {
    const runRes = await fetch("http://localhost:3005/api/code/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: 'print("Hello, Python!")', input: "" })
    });
    const runData = await runRes.json();
    assert(runData.stdout.trim() === "Hello, Python!", "Run Code executes Python in sandbox and captures stdout", `Got: ${runData.stdout}`);
    assert(runData.executionMs >= 0, "Execution duration is measured in milliseconds");
  } catch (e) {
    assert(false, "Run code execution", e.message);
  }

  // 5. Test Debugger & Traceback Analysis
  try {
    const debugRes = await fetch("http://localhost:3005/api/code/debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "a = 10\nb = 0\nprint(a / b)", input: "" })
    });
    const debugData = await debugRes.json();
    assert(debugData.debugAnalysis?.hasError === true, "Debugger detects runtime error");
    assert(debugData.debugAnalysis?.errorType === "ZeroDivisionError", "Debugger correctly identifies ZeroDivisionError");
    assert(debugData.debugAnalysis?.lineNumber === 3, `Debugger pinpoints exact line (expected 3, got ${debugData.debugAnalysis?.lineNumber})`);
    assert(Boolean(debugData.debugAnalysis?.friendlyExplanation), "Debugger provides learner-friendly explanation");
  } catch (e) {
    assert(false, "Debug traceback analyzer", e.message);
  }

  // 6. Test Security Barrier (AST Filter)
  try {
    const secRes = await fetch("http://localhost:3005/api/code/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "import os\nos.system('dir')", input: "" })
    });
    const secData = await secRes.json();
    assert(Boolean(secData.securityViolation), "Security AST filter blocks forbidden module imports (import os)");
  } catch (e) {
    assert(false, "Security filter check", e.message);
  }

  // 7. Test Submission & Level Unlock Flow (Levels 1 Problems 1 through 5)
  console.log("\n  Submitting solutions for Level 1 problems to verify unlock engine...");
  const level1Solutions = [
    { id: "PY-L01-P01", code: 'print("Hello, Python!")' },
    { id: "PY-L01-P02", code: 'name = input()\nprint(f"Welcome, {name}!")' },
    { id: "PY-L01-P03", code: 'a = int(input())\nb = int(input())\nprint(a + b)' },
    { id: "PY-L01-P04", code: 'length = int(input())\nwidth = int(input())\nprint(length * width)' },
    { id: "PY-L01-P05", code: 'a = int(input())\nb = int(input())\nprint(a + b)\nprint(a - b)\nprint(a * b)' },
  ];

  let lastUnlockInfo = null;
  for (const sol of level1Solutions) {
    try {
      const subRes = await fetch("http://localhost:3005/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: sol.id, code: sol.code })
      });
      const subData = await subRes.json();
      assert(subData.overallStatus === "ACCEPTED", `Submission for ${sol.id} is ACCEPTED`);
      lastUnlockInfo = subData.unlockInfo;
    } catch (e) {
      assert(false, `Submitting ${sol.id}`, e.message);
    }
  }

  // Check that solving 5/5 problems marked Level 1 complete and unlocked Level 2!
  assert(lastUnlockInfo?.levelCompleted === true, "Level 1 is marked COMPLETED upon 5/5 accepted submissions");
  assert(lastUnlockInfo?.nextLevelUnlocked === 2, "Level 2 is automatically UNLOCKED");

  // Verify updated status via Levels API
  try {
    const updatedLvlRes = await fetch("http://localhost:3005/api/levels");
    const updatedLevels = await updatedLvlRes.json();
    const lvl1 = updatedLevels.levels.find(l => l.number === 1);
    const lvl2 = updatedLevels.levels.find(l => l.number === 2);
    assert(lvl1.status === "COMPLETED", "Roadmap shows Level 1 as COMPLETED");
    assert(lvl2.status === "UNLOCKED", "Roadmap shows Level 2 as UNLOCKED");
  } catch (e) {
    assert(false, "Verify Level 2 unlock in Roadmap", e.message);
  }

  // 8. Admin Metrics Check
  try {
    const adminRes = await fetch("http://localhost:3005/api/admin/submissions");
    const adminData = await adminRes.json();
    assert(adminData.stats?.total >= 5, "Admin analytics records submissions");
    assert(adminData.stats?.accepted >= 5, "Admin analytics records accepted solutions");
  } catch (e) {
    assert(false, "Admin submissions endpoint", e.message);
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
