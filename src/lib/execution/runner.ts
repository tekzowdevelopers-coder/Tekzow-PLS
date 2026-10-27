import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionMs: number;
  timedOut: boolean;
  securityViolation?: string;
}

// Block dangerous modules and system calls in educational environment
const FORBIDDEN_PATTERNS = [
  /import\s+(os|subprocess|sys|shutil|socket|urllib|requests|http|ctypes|winreg|pty|builtins)/i,
  /from\s+(os|subprocess|sys|shutil|socket|urllib|requests|http|ctypes|winreg|pty|builtins)\s+import/i,
  /__import__\s*\(\s*['"](os|subprocess|sys|shutil|socket|urllib|requests|http|ctypes)/i,
  /eval\s*\(/,
  /exec\s*\(/,
  /open\s*\(\s*['"][^'"]*(\/|\\|\.\.)/i,
];

export function checkCodeSafety(code: string): string | null {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return `Security restriction: For platform safety, usage of system, network, or process execution modules is not permitted.`;
    }
  }
  return null;
}

let defaultBaseUrl = "";

export function setRunnerBaseUrl(url: string) {
  defaultBaseUrl = url;
}

// Execute via Vercel native Python serverless function (/api/py_exec)
async function executeViaVercelPython(
  code: string,
  inputData: string = "",
  timeoutMs: number = 4000
): Promise<ExecutionResult | null> {
  try {
    let baseUrl = defaultBaseUrl;
    if (!baseUrl) {
      const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
      if (host) {
        const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
        baseUrl = `${protocol}://${host}`;
      }
    }
    if (!baseUrl) return null;
    const url = `${baseUrl}/api/py_exec`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs + 1000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, input: inputData, timeout: timeoutMs / 1000 }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      return {
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        exitCode: data.exitCode ?? 0,
        executionMs: data.executionMs || 10,
        timedOut: !!data.timedOut,
        securityViolation: data.securityViolation,
      };
    }
  } catch (err) {
    console.warn("Vercel python runner fetch notice:", err);
  }
  return null;
}

export async function executePython(
  code: string,
  inputData: string = "",
  timeoutMs: number = 4000
): Promise<ExecutionResult> {
  // 1. Static security check
  const safetyError = checkCodeSafety(code);
  if (safetyError) {
    return {
      stdout: "",
      stderr: safetyError,
      exitCode: 1,
      executionMs: 0,
      timedOut: false,
      securityViolation: safetyError,
    };
  }

  // 2. If running on Vercel, delegate to Vercel native Python Serverless function (/api/py_exec)
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    const vercelPyRes = await executeViaVercelPython(code, inputData, timeoutMs);
    if (vercelPyRes) {
      return vercelPyRes;
    }
  }

  // 3. Setup isolated execution sandbox for native local runner
  const runId = `py_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const sandboxDir = path.join(os.tmpdir(), "pylearn_sandbox", runId);

  try {
    await fs.mkdir(sandboxDir, { recursive: true });
    const scriptPath = path.join(sandboxDir, "solution.py");
    await fs.writeFile(scriptPath, code, "utf-8");
  } catch (err: any) {
    return {
      stdout: "",
      stderr: `Sandbox initialization error: ${err.message}`,
      exitCode: 1,
      executionMs: 0,
      timedOut: false,
    };
  }

  const pythonCmd = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");

  const startTime = Date.now();
  let timedOut = false;
  let stdoutData = "";
  let stderrData = "";
  const MAX_BUFFER = 512 * 1024; // 512 KB limit

  return new Promise<ExecutionResult>((resolve) => {
    let proc: any;
    try {
      proc = spawn(pythonCmd, ["-u", "-B", "solution.py"], {
        cwd: sandboxDir,
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONDONTWRITEBYTECODE: "1",
        },
      });
    } catch (err: any) {
      fs.rm(sandboxDir, { recursive: true, force: true }).catch(() => {});
      return resolve({
        stdout: "",
        stderr: `Execution error: ${err.message}`,
        exitCode: 1,
        executionMs: 0,
        timedOut: false,
      });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", proc.pid!.toString(), "/f", "/t"]);
        } else {
          proc.kill("SIGKILL");
        }
      } catch {
        proc.kill();
      }
    }, timeoutMs);

    if (inputData) {
      try {
        proc.stdin.write(inputData);
      } catch {
        // ignore stdin write errors
      }
    }
    proc.stdin.end();

    proc.stdout.on("data", (data: any) => {
      if (stdoutData.length < MAX_BUFFER) {
        stdoutData += data.toString("utf-8");
      }
    });

    proc.stderr.on("data", (data: any) => {
      if (stderrData.length < MAX_BUFFER) {
        stderrData += data.toString("utf-8");
      }
    });

    proc.on("close", async (code: number | null) => {
      clearTimeout(timer);
      const executionMs = Date.now() - startTime;

      try {
        await fs.rm(sandboxDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }

      const sanitizedStderr = stderrData
        .replace(new RegExp(sandboxDir.replace(/\\/g, "\\\\"), "g"), "")
        .replace(/File "solution\.py"/g, 'File "solution.py"');

      resolve({
        stdout: stdoutData,
        stderr: sanitizedStderr,
        exitCode: timedOut ? null : code,
        executionMs,
        timedOut,
      });
    });

    proc.on("error", async (err: any) => {
      clearTimeout(timer);
      try {
        await fs.rm(sandboxDir, { recursive: true, force: true });
      } catch {}

      resolve({
        stdout: stdoutData,
        stderr: `Execution system error: ${err.message}`,
        exitCode: 1,
        executionMs: Date.now() - startTime,
        timedOut: false,
      });
    });
  });
}
