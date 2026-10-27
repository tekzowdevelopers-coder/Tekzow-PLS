"use client";

declare global {
  interface Window {
    loadPyodide?: any;
    __pyodideInstance?: any;
    __pyodidePromise?: Promise<any>;
  }
}

export async function initClientPyodide(): Promise<any> {
  if (typeof window === "undefined") return null;
  if (window.__pyodideInstance) return window.__pyodideInstance;
  if (window.__pyodidePromise) return window.__pyodidePromise;

  window.__pyodidePromise = (async () => {
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[src*="pyodide.js"]');
        if (existing) {
          existing.addEventListener("load", () => resolve());
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Python engine from CDN"));
        document.head.appendChild(script);
      });
    }

    const py = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
    });
    window.__pyodideInstance = py;
    return py;
  })();

  return window.__pyodidePromise;
}

export async function runClientPython(
  code: string,
  inputData: string = "",
  timeoutMs: number = 4000
): Promise<{
  stdout: string;
  stderr: string;
  executionMs: number;
  exitCode: number;
  timedOut: boolean;
}> {
  const startTime = Date.now();
  let stdoutData = "";
  let stderrData = "";
  let timedOut = false;
  let exitCode = 0;

  try {
    const py = await initClientPyodide();

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

    let timer: any;
    const runPromise = py.runPythonAsync(code, { globals: isolatedGlobals });
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        reject(new Error("Timeout"));
      }, timeoutMs);
    });

    await Promise.race([runPromise, timeoutPromise]).finally(() => {
      clearTimeout(timer);
    });

    exitCode = 0;
  } catch (err: any) {
    if (timedOut) {
      exitCode = 124;
      stderrData = `Time Limit Exceeded: Execution took longer than ${timeoutMs}ms.`;
    } else {
      exitCode = 1;
      const rawError = err?.message || String(err);
      const execIdx = rawError.indexOf('File "<exec>"');
      if (execIdx !== -1) {
        const studentPart = rawError.substring(execIdx).replace(/File "<exec>"/g, 'File "solution.py"');
        stderrData = `Traceback (most recent call last):\n  ${studentPart}`;
      } else {
        stderrData = rawError
          .replace(/File "\/lib\/python3\d+\.zip\/_pyodide\/_base\.py", line \d+, in .*\n/g, "")
          .replace(/File "<exec>"/g, 'File "solution.py"');
      }
    }
  }

  return {
    stdout: stdoutData,
    stderr: stderrData,
    executionMs: Date.now() - startTime,
    exitCode,
    timedOut,
  };
}
