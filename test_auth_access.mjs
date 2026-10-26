// Verification Suite for Login Enforcement & Student Access Control

async function runAuthTests() {
  console.log("🔒 Running Authentication & Access Control Verification Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = "") {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  // 1. UNAUTHENTICATED TESTS (No Login)
  console.log("--- 1. Testing Unauthenticated Request Restrictions ---");

  // Visiting /dashboard without cookie should redirect to /login
  try {
    const res = await fetch("http://localhost:3005/dashboard", { redirect: "manual" });
    assert(
      res.status === 307 || res.status === 308 || res.status === 302,
      "Unauthenticated /dashboard redirects to /login",
      `Status: ${res.status}`
    );
    const location = res.headers.get("location") || "";
    assert(location.includes("/login"), "Redirect location points to /login", `Location: ${location}`);
  } catch (e) {
    assert(false, "Unauthenticated /dashboard redirect", e.message);
  }

  // Visiting /admin without cookie should redirect to /login
  try {
    const res = await fetch("http://localhost:3005/admin", { redirect: "manual" });
    assert(
      res.status === 307 || res.status === 308 || res.status === 302,
      "Unauthenticated /admin redirects to /login",
      `Status: ${res.status}`
    );
  } catch (e) {
    assert(false, "Unauthenticated /admin redirect", e.message);
  }

  // Calling /api/progress without auth returns 401
  try {
    const res = await fetch("http://localhost:3005/api/progress");
    assert(res.status === 401, "Calling /api/progress without login returns 401 Unauthorized", `Status: ${res.status}`);
  } catch (e) {
    assert(false, "Unauthenticated /api/progress", e.message);
  }

  // Calling /api/submissions without auth returns 401
  try {
    const res = await fetch("http://localhost:3005/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: "PY-L01-P01", code: 'print("test")' })
    });
    assert(res.status === 401, "Calling /api/submissions without login returns 401 Unauthorized", `Status: ${res.status}`);
  } catch (e) {
    assert(false, "Unauthenticated /api/submissions", e.message);
  }

  // 2. STUDENT LOGIN & ADMIN RESTRICTIONS
  console.log("\n--- 2. Testing Student Role-Based Access Controls ---");
  let studentCookie = "";
  try {
    const loginRes = await fetch("http://localhost:3005/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@example.com", password: "password123" })
    });
    assert(loginRes.status === 200, "Student login succeeds");
    const rawCookie = loginRes.headers.get("set-cookie") || "";
    studentCookie = rawCookie.split(";")[0];
    assert(Boolean(studentCookie), "Student received auth_token cookie");
  } catch (e) {
    assert(false, "Student login", e.message);
  }

  // Student trying to access /admin page directly -> Middleware redirects student to /dashboard
  try {
    const adminPageRes = await fetch("http://localhost:3005/admin", {
      headers: { Cookie: studentCookie },
      redirect: "manual"
    });
    assert(
      adminPageRes.status === 307 || adminPageRes.status === 308 || adminPageRes.status === 302,
      "Student accessing /admin is redirected away",
      `Status: ${adminPageRes.status}`
    );
    const loc = adminPageRes.headers.get("location") || "";
    assert(loc.includes("/dashboard"), "Student redirected to /dashboard from /admin", `Location: ${loc}`);
  } catch (e) {
    assert(false, "Student /admin redirect", e.message);
  }

  // Student trying to call /api/admin/submissions -> 403 Forbidden
  try {
    const adminSubRes = await fetch("http://localhost:3005/api/admin/submissions", {
      headers: { Cookie: studentCookie }
    });
    assert(
      adminSubRes.status === 403,
      "Student calling /api/admin/submissions is rejected with 403 Forbidden",
      `Status: ${adminSubRes.status}`
    );
  } catch (e) {
    assert(false, "Student calling admin submissions", e.message);
  }

  // Student trying to call /api/admin/reset-progress -> 403 Forbidden
  try {
    const resetRes = await fetch("http://localhost:3005/api/admin/reset-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ email: "student@example.com" })
    });
    assert(
      resetRes.status === 403,
      "Student calling /api/admin/reset-progress is rejected with 403 Forbidden",
      `Status: ${resetRes.status}`
    );
  } catch (e) {
    assert(false, "Student calling reset progress", e.message);
  }

  // 3. ADMIN LOGIN
  console.log("\n--- 3. Testing Admin Access ---");
  let adminCookie = "";
  try {
    const adminLoginRes = await fetch("http://localhost:3005/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "admin123" })
    });
    assert(adminLoginRes.status === 200, "Admin login succeeds");
    adminCookie = (adminLoginRes.headers.get("set-cookie") || "").split(";")[0];
  } catch (e) {
    assert(false, "Admin login", e.message);
  }

  // Admin calling /api/admin/submissions succeeds
  try {
    const adminSubRes = await fetch("http://localhost:3005/api/admin/submissions", {
      headers: { Cookie: adminCookie }
    });
    assert(adminSubRes.status === 200, "Admin accessing /api/admin/submissions succeeds with 200 OK");
  } catch (e) {
    assert(false, "Admin submissions call", e.message);
  }

  // Reset student progress using Admin credentials so Level 2 is locked
  try {
    const resetRes = await fetch("http://localhost:3005/api/admin/reset-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ email: "student@example.com" })
    });
    assert(resetRes.status === 200, "Admin successfully resets student progress to Level 1");
  } catch (e) {
    assert(false, "Admin reset progress", e.message);
  }

  // 4. LOCKED LEVEL ACCESS PROTECTION
  console.log("\n--- 4. Testing Locked Level Restrictions for Student ---");

  // Student can access unlocked Level 1 Problem 1
  try {
    const l1Res = await fetch("http://localhost:3005/api/problems/PY-L01-P01", {
      headers: { Cookie: studentCookie }
    });
    assert(l1Res.status === 200, "Student CAN access unlocked Level 1 problem");
  } catch (e) {
    assert(false, "Student accessing Level 1", e.message);
  }

  // Student CANNOT access locked Level 2 Problem 1
  try {
    const l2Res = await fetch("http://localhost:3005/api/problems/PY-L02-P01", {
      headers: { Cookie: studentCookie }
    });
    assert(
      l2Res.status === 403,
      "Student CANNOT access locked Level 2 problem (rejected with 403)",
      `Status: ${l2Res.status}`
    );
    const l2Data = await l2Res.json();
    assert(l2Data.isLocked === true, "Response payload indicates isLocked: true");
  } catch (e) {
    assert(false, "Student accessing locked Level 2", e.message);
  }

  // Student CANNOT submit code to locked Level 2 Problem
  try {
    const subL2Res = await fetch("http://localhost:3005/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ problemId: "PY-L02-P01", code: 'print("cheat")' })
    });
    assert(
      subL2Res.status === 403,
      "Student submission to locked Level 2 problem is blocked with 403",
      `Status: ${subL2Res.status}`
    );
  } catch (e) {
    assert(false, "Student submitting to locked level", e.message);
  }

  console.log(`\n======================================================`);
  console.log(`Access Control Suite: ${passed} passed, ${failed} failed.`);
  console.log(`======================================================\n`);

  if (failed > 0) process.exit(1);
}

runAuthTests().catch(e => {
  console.error(e);
  process.exit(1);
});
