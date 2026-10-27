import { NextRequest, NextResponse } from "next/server";
import { executePython, setRunnerBaseUrl } from "@/lib/execution/runner";
import { analyzeTraceback } from "@/lib/debugger/traceback-analyzer";

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get("host");
    if (host) {
      const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
      setRunnerBaseUrl(`${protocol}://${host}`);
    }

    const { code, input = "" } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const execResult = await executePython(code, input, 4000);
    const debugAnalysis = analyzeTraceback(execResult.stderr, code);

    return NextResponse.json({
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      executionMs: execResult.executionMs,
      timedOut: execResult.timedOut,
      debugAnalysis,
    });
  } catch (error: any) {
    console.error("Debug code error:", error);
    return NextResponse.json({ error: error.message || "Debug execution error" }, { status: 500 });
  }
}
