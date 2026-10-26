import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/execution/runner";
import { analyzeTraceback } from "@/lib/debugger/traceback-analyzer";

export async function POST(req: NextRequest) {
  try {
    const { code, input = "" } = await req.json();

    if (code === undefined || code === null) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const execResult = await executePython(code, input, 4000);
    const debugAnalysis = execResult.stderr
      ? analyzeTraceback(execResult.stderr, code)
      : null;

    return NextResponse.json({
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      exitCode: execResult.exitCode,
      executionMs: execResult.executionMs,
      timedOut: execResult.timedOut,
      securityViolation: execResult.securityViolation,
      debugAnalysis,
    });
  } catch (error: any) {
    console.error("Run code error:", error);
    return NextResponse.json({ error: error.message || "Execution error" }, { status: 500 });
  }
}
