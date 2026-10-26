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
  /open\s*\(\s*['"][^'"]*(\/|\\|\.\.)/i, // block opening external files / path traversal
];

export function checkCodeSafety(code: string): string | null {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return `Security restriction: For platform safety, usage of system, network, or process execution modules is not permitted.`;
    }
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

  // 2. Setup isolated execution sandbox
  const runId = `py_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const sandboxDir = path.join(os.tmpdir(), "pylearn_sandbox", runId);

  await fs.mkdir(sandboxDir, { recursive: true });
  const scriptPath = path.join(sandboxDir, "solution.py");
  await fs.writeFile(scriptPath, code, "utf-8");

  const pythonCmd = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");

  const startTime = Date.now();
  let timedOut = false;
  let stdoutData = "";
  let stderrData = "";
  const MAX_BUFFER = 512 * 1024; // 512 KB limit

  return new Promise<ExecutionResult>((resolve) => {
    // Run with -u for unbuffered binary stdout/stderr and -B (no .pyc creation)
    const proc = spawn(pythonCmd, ["-u", "-B", "solution.py"], {
      cwd: sandboxDir,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONDONTWRITEBYTECODE: "1",
      },
    });

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

    proc.stdout.on("data", (data) => {
      if (stdoutData.length < MAX_BUFFER) {
        stdoutData += data.toString("utf-8");
      }
    });

    proc.stderr.on("data", (data) => {
      if (stderrData.length < MAX_BUFFER) {
        stderrData += data.toString("utf-8");
      }
    });

    proc.on("close", async (code) => {
      clearTimeout(timer);
      const executionMs = Date.now() - startTime;

      // Clean up sandbox
      try {
        await fs.rm(sandboxDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }

      // Sanitize sandbox paths in stderr so students see clean tracebacks
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

    proc.on("error", async (err) => {
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
