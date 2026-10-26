import { executePython, ExecutionResult } from "../execution/runner";

export interface TestCaseItem {
  id: string;
  type: string; // "VISIBLE" | "HIDDEN"
  inputData: string;
  expectedOutput: string;
}

export interface SingleTestResult {
  testCaseId: string;
  type: string;
  status: "PASSED" | "FAILED" | "TIME_LIMIT" | "RUNTIME_ERROR";
  executionMs: number;
  input?: string;
  expected?: string;
  actual?: string;
  error?: string;
}

export interface EvaluationSummary {
  overallStatus: "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "TIME_LIMIT" | "SECURITY_VIOLATION";
  passedCount: number;
  totalCount: number;
  maxExecutionMs: number;
  results: SingleTestResult[];
  errorMessage?: string;
}

/**
 * Normalizes output string for fair comparison:
 * - standardizes line endings (\r\n -> \n)
 * - trims trailing spaces on each line
 * - trims trailing newlines
 */
export function normalizeOutput(str: string): string {
  if (!str) return "";
  return str
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Compare two outputs with float tolerance check if numeric
 */
export function outputsMatch(actual: string, expected: string): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);

  if (normActual === normExpected) return true;

  // Check if each line matches numerically (for float/scientific outputs)
  const actualLines = normActual.split("\n");
  const expectedLines = normExpected.split("\n");

  if (actualLines.length !== expectedLines.length) return false;

  for (let i = 0; i < actualLines.length; i++) {
    const act = actualLines[i].trim();
    const exp = expectedLines[i].trim();

    if (act === exp) continue;

    // Try float comparison
    const numAct = parseFloat(act);
    const numExp = parseFloat(exp);
    if (!isNaN(numAct) && !isNaN(numExp)) {
      if (Math.abs(numAct - numExp) < 0.001) {
        continue;
      }
    }

    return false;
  }

  return true;
}

export async function evaluateSubmission(
  code: string,
  testCases: TestCaseItem[],
  timeoutMs: number = 4000
): Promise<EvaluationSummary> {
  const results: SingleTestResult[] = [];
  let passedCount = 0;
  let maxExecutionMs = 0;
  let overallStatus: EvaluationSummary["overallStatus"] = "ACCEPTED";
  let firstErrorMessage: string | undefined;

  for (const test of testCases) {
    const exec: ExecutionResult = await executePython(code, test.inputData, timeoutMs);
    maxExecutionMs = Math.max(maxExecutionMs, exec.executionMs);

    if (exec.securityViolation) {
      return {
        overallStatus: "SECURITY_VIOLATION",
        passedCount: 0,
        totalCount: testCases.length,
        maxExecutionMs: 0,
        results: [],
        errorMessage: exec.securityViolation,
      };
    }

    if (exec.timedOut) {
      overallStatus = "TIME_LIMIT";
      firstErrorMessage = firstErrorMessage || "Time Limit Exceeded (program took too long or has an infinite loop)";
      results.push({
        testCaseId: test.id,
        type: test.type,
        status: "TIME_LIMIT",
        executionMs: exec.executionMs,
        error: "Execution timed out.",
        ...(test.type === "VISIBLE" ? { input: test.inputData } : {}),
      });
      break; // stop evaluating after timeout
    }

    if (exec.exitCode !== 0 && exec.stderr) {
      overallStatus = overallStatus === "ACCEPTED" ? "RUNTIME_ERROR" : overallStatus;
      firstErrorMessage = firstErrorMessage || exec.stderr;
      results.push({
        testCaseId: test.id,
        type: test.type,
        status: "RUNTIME_ERROR",
        executionMs: exec.executionMs,
        error: exec.stderr,
        ...(test.type === "VISIBLE" ? { input: test.inputData, expected: test.expectedOutput, actual: exec.stdout } : {}),
      });
      continue;
    }

    const isMatch = outputsMatch(exec.stdout, test.expectedOutput);
    if (isMatch) {
      passedCount++;
      results.push({
        testCaseId: test.id,
        type: test.type,
        status: "PASSED",
        executionMs: exec.executionMs,
        ...(test.type === "VISIBLE" ? { input: test.inputData, expected: test.expectedOutput, actual: exec.stdout } : {}),
      });
    } else {
      if (overallStatus === "ACCEPTED") {
        overallStatus = "WRONG_ANSWER";
      }
      results.push({
        testCaseId: test.id,
        type: test.type,
        status: "FAILED",
        executionMs: exec.executionMs,
        // Crucial security rule: Only expose input and expected output for VISIBLE tests!
        ...(test.type === "VISIBLE"
          ? {
              input: test.inputData,
              expected: test.expectedOutput,
              actual: exec.stdout,
            }
          : {
              error: "Incorrect output on test case.",
            }),
      });
    }
  }

  if (passedCount !== testCases.length && overallStatus === "ACCEPTED") {
    overallStatus = "WRONG_ANSWER";
  }

  return {
    overallStatus,
    passedCount,
    totalCount: testCases.length,
    maxExecutionMs,
    results,
    errorMessage: firstErrorMessage,
  };
}
