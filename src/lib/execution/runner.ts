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

// Pyodide singleton caching for ultra-fast in-memory executions
let pyodideInstance: any = null;
let pyodideInitPromise: Promise<any> | null = null;

async function getPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (!pyodideInitPromise) {
    pyodideInitPromise = (async () => {
      const { loadPyodide } = await import("pyodide");
      const py = await loadPyodide();
      pyodideInstance = py;
      return py;
    })();
  }
  return pyodideInitPromise;
}

function cleanPyodideStderr(raw: string): string {
  const execIdx = raw.indexOf('File "<exec>"');
  if (execIdx !== -1) {
    const studentPart = raw.substring(execIdx).replace(/File "<exec>"/g, 'File "solution.py"');
    return `Traceback (most recent call last):\n  ${studentPart}`;
  }
  return raw
    .replace(/File "\/lib\/python3\d+\.zip\/_pyodide\/_base\.py", line \d+, in .*\n/g, "")
    .replace(/File "<exec>"/g, 'File "solution.py"');
}

export async function executeWithPyodide(
  code: string,
  inputData: string = "",
  timeoutMs: number = 4000
): Promise<ExecutionResult> {
  const startTime = Date.now();
  let stdoutData = "";
  let stderrData = "";
  let timedOut = false;
  let exitCode = 0;

  try {
    const py = await getPyodide();

    py.setStdout({
      batched: (msg: string) => {
        stdoutData += msg + "\n";
      },
    });

    py.setStderr({
      batched: (msg: string) => {
        stderrData += msg + "\n";
      },
    });

    const inputLines = inputData ? inputData.split(/\r?\n/) : [];
    let inputIdx = 0;
    py.setStdin({
      stdin: () => {
        if (inputIdx < inputLines.length) {
          return inputLines[inputIdx++] + "\n";
        }
        return "";
      },
      isatty: false,
    });

    const isolatedGlobals = py.toPy({});

    let timer: NodeJS.Timeout;
    const executionPromise = py.runPythonAsync(code, { globals: isolatedGlobals });
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        reject(new Error("Execution timed out"));
      }, timeoutMs);
    });

    await Promise.race([executionPromise, timeoutPromise]).finally(() => {
      clearTimeout(timer);
    });

    exitCode = 0;
  } catch (err: any) {
    if (timedOut) {
      exitCode = 124;
      stderrData = `Time Limit Exceeded: Execution took longer than ${timeoutMs}ms. Check for infinite loops or unbounded inputs.`;
    } else {
      exitCode = 1;
      const rawError = err?.message || String(err);
      stderrData = cleanPyodideStderr(rawError);
    }
  }

  return {
    stdout: stdoutData,
    stderr: stderrData,
    exitCode: timedOut ? null : exitCode,
    executionMs: Date.now() - startTime,
    timedOut,
  };
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

  // If running in Vercel environment, standard Node lambda does not include a python3 binary.
  // Execute via Pyodide WASM directly for instant, secure execution without external process dependencies.
  if (process.env.VERCEL) {
    return executeWithPyodide(code, inputData, timeoutMs);
  }

  // 2. Setup isolated execution sandbox for native local runner
  const runId = `py_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const sandboxDir = path.join(os.tmpdir(), "pylearn_sandbox", runId);

  try {
    await fs.mkdir(sandboxDir, { recursive: true });
    const scriptPath = path.join(sandboxDir, "solution.py");
    await fs.writeFile(scriptPath, code, "utf-8");
  } catch {
    return executeWithPyodide(code, inputData, timeoutMs);
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
    } catch {
      fs.rm(sandboxDir, { recursive: true, force: true }).catch(() => {});
      return resolve(executeWithPyodide(code, inputData, timeoutMs));
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

      // If spawn returned ENOENT (e.g. python3 missing on Vercel), seamlessly fallback to Pyodide!
      if (err.code === "ENOENT" || err.message?.includes("ENOENT")) {
        const pyodideRes = await executeWithPyodide(code, inputData, timeoutMs);
        return resolve(pyodideRes);
      }

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
