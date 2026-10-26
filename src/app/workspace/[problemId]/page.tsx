"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import {
  Play,
  Bug,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Terminal,
  BookOpen,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  FileCode,
  Flame,
  Lock,
} from "lucide-react";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params?.problemId as string;

  const [problem, setProblem] = useState<any>(null);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Console & Results states
  const [activeTab, setActiveTab] = useState<"console" | "tests" | "debug" | "customInput">("console");
  const [stdout, setStdout] = useState<string>("");
  const [stderr, setStderr] = useState<string>("");
  const [executionMs, setExecutionMs] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);

  // Evaluation states
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [debugAnalysis, setDebugAnalysis] = useState<any>(null);

  // Celebration Modal
  const [unlockModal, setUnlockModal] = useState<{
    isOpen: boolean;
    levelCompleted: boolean;
    nextLevel: number | null;
  }>({ isOpen: false, levelCompleted: false, nextLevel: null });

  // Progressive hints
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [copiedInput, setCopiedInput] = useState<string | null>(null);
  const [lockedError, setLockedError] = useState<string | null>(null);

  useEffect(() => {
    if (!problemId) return;
    setLoading(true);
    setLockedError(null);
    setEvaluationResult(null);
    setDebugAnalysis(null);
    setStdout("");
    setStderr("");

    fetch(`/api/problems/${problemId}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.push(`/login?from=/workspace/${problemId}`);
          return null;
        }
        const data = await res.json();
        if (res.status === 403 || data.isLocked) {
          setLockedError(data.error || "This level is locked. Complete all previous level problems first.");
          return null;
        }
        return data;
      })
      .then((data) => {
        if (data?.problem) {
          setProblem(data.problem);
          setCode(data.problem.lastCode || data.problem.starterCode || "");
          // Preset custom input with first sample test input
          if (data.problem.visibleTests?.[0]?.inputData) {
            setCustomInput(data.problem.visibleTests[0].inputData);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [problemId]);

  // Run Code against sample or custom input
  const handleRunCode = async (useCustomInput: boolean = false) => {
    setIsExecuting(true);
    setActiveTab("console");
    setStdout("Executing Python in isolated sandbox...");
    setStderr("");

    const inputData = useCustomInput
      ? customInput
      : problem?.visibleTests?.[0]?.inputData || "";

    try {
      const res = await fetch("/api/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, input: inputData }),
      });

      const data = await res.json();
      setStdout(data.stdout || "");
      setStderr(data.stderr || "");
      setExecutionMs(data.executionMs);
      if (data.debugAnalysis?.hasError) {
        setDebugAnalysis(data.debugAnalysis);
      }
    } catch (err: any) {
      setStderr(err.message || "Execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  // Debug Code
  const handleDebugCode = async () => {
    setIsExecuting(true);
    setActiveTab("debug");
    try {
      const inputData = customInput || problem?.visibleTests?.[0]?.inputData || "";
      const res = await fetch("/api/code/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, input: inputData }),
      });
      const data = await res.json();
      setStdout(data.stdout || "");
      setStderr(data.stderr || "");
      setExecutionMs(data.executionMs);
      setDebugAnalysis(data.debugAnalysis);
    } catch (err: any) {
      setStderr(err.message || "Debug execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  // Submit Solution against all tests
  const handleSubmit = async () => {
    setIsExecuting(true);
    setActiveTab("tests");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, code }),
      });

      const data = await res.json();
      setEvaluationResult(data);
      setExecutionMs(data.maxExecutionMs);

      if (data.overallStatus === "ACCEPTED") {
        setProblem((prev: any) => ({ ...prev, userStatus: "ACCEPTED" }));
        if (data.unlockInfo?.levelCompleted) {
          setUnlockModal({
            isOpen: true,
            levelCompleted: true,
            nextLevel: data.unlockInfo.nextLevelUnlocked,
          });
        }
      } else if (data.errorMessage) {
        setStderr(data.errorMessage);
      }
    } catch (err: any) {
      setStderr(err.message || "Submission failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleResetCode = () => {
    if (confirm("Reset editor to starter code?")) {
      setCode(problem?.starterCode || "");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInput(id);
    setTimeout(() => setCopiedInput(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading workspace environment...</span>
        </div>
      </div>
    );
  }

  if (lockedError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted: Level Locked</h2>
        <p className="text-sm text-gray-300 leading-relaxed bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          {lockedError}
        </p>
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/roadmap"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/30"
          >
            Go to Roadmap
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard"
            className="bg-[#21262d] hover:bg-[#30363d] text-gray-200 font-semibold px-4 py-2.5 rounded-lg text-xs border border-[#30363d] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
        <p className="text-lg text-white mb-2">Problem Not Found</p>
        <Link href="/roadmap" className="text-blue-400 hover:underline text-sm">
          Return to Roadmap
        </Link>
      </div>
    );
  }

  const levelNum = problem.level?.number || 1;
  const isAccepted = problem.userStatus === "ACCEPTED";

  // Navigation: prev / next problem ID
  const probOrder = problem.orderIndex || 1;
  const prevProbId =
    probOrder > 1
      ? `PY-L${String(levelNum).padStart(2, "0")}-P0${probOrder - 1}`
      : null;
  const nextProbId =
    probOrder < 5
      ? `PY-L${String(levelNum).padStart(2, "0")}-P0${probOrder + 1}`
      : null;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden">
      {/* Workspace Sub-header */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex items-center justify-between flex-shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/roadmap"
            className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Roadmap
          </Link>
          <span className="text-[#30363d]">/</span>
          <span className="font-semibold text-white">
            Level {levelNum}: {problem.level?.title}
          </span>
          <span className="text-[#30363d]">/</span>
          <span className="text-gray-300 font-medium">Problem {probOrder} of 5</span>
          {isAccepted && (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Solved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {prevProbId ? (
            <Link
              href={`/workspace/${prevProbId}`}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
              title="Previous Problem"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-1.5 text-gray-400 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </span>
          )}

          <span className="text-gray-400 font-mono">
            {problem.id}
          </span>

          {nextProbId ? (
            <Link
              href={`/workspace/${nextProbId}`}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
              title="Next Problem"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-1.5 text-gray-400 cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Problem Description & Test Cases (5 cols) */}
        <div className="lg:col-span-5 border-r border-[#30363d] flex flex-col h-full bg-[#0d1117] overflow-y-auto p-4 sm:p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {problem.title}
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {problem.difficulty}
              </span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span className="text-amber-400 font-medium">Concept:</span>
              <span>{problem.concept}</span>
            </div>
          </div>

          {/* Learning Objective Box */}
          <div className="bg-[#161b22] border border-blue-500/30 rounded-xl p-3.5 text-xs">
            <span className="font-semibold text-blue-400 block mb-1">🎯 Learning Objective:</span>
            <p className="text-gray-300 leading-relaxed">{problem.objective}</p>
          </div>

          {/* Statement */}
          <div className="space-y-3">
            <h2 className="text-xs uppercase font-semibold text-gray-400 tracking-wider">
              Problem Statement
            </h2>
            <div className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">
              {problem.statement}
            </div>
          </div>

          {/* Input & Output Specifications */}
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-gray-300 block mb-1">📥 Input Format:</span>
              <div className="bg-[#161b22] p-2.5 rounded-lg border border-[#30363d] font-mono text-gray-300 whitespace-pre-wrap">
                {problem.inputFormat}
              </div>
            </div>
            <div>
              <span className="font-semibold text-gray-300 block mb-1">📤 Output Format:</span>
              <div className="bg-[#161b22] p-2.5 rounded-lg border border-[#30363d] font-mono text-gray-300 whitespace-pre-wrap">
                {problem.outputFormat}
              </div>
            </div>
            {problem.constraints && (
              <div>
                <span className="font-semibold text-gray-300 block mb-1">⚡ Constraints:</span>
                <div className="bg-[#161b22] p-2 rounded-lg border border-[#30363d] font-mono text-gray-400">
                  {problem.constraints}
                </div>
              </div>
            )}
          </div>

          {/* Visible Sample Examples */}
          <div className="space-y-3">
            <h2 className="text-xs uppercase font-semibold text-gray-400 tracking-wider">
              Sample Test Cases (Visible)
            </h2>
            <div className="space-y-2">
              {problem.visibleTests?.map((tc: any, idx: number) => (
                <div
                  key={tc.id || idx}
                  className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="font-mono font-semibold text-gray-300">Sample {idx + 1}</span>
                    {tc.inputData && (
                      <button
                        onClick={() => copyToClipboard(tc.inputData, tc.id)}
                        className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {copiedInput === tc.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedInput === tc.id ? "Copied" : "Copy Input"}
                      </button>
                    )}
                  </div>

                  {tc.inputData ? (
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block mb-0.5">Input:</span>
                      <pre className="bg-[#0d1117] p-2 rounded border border-[#30363d] font-mono text-emerald-400 overflow-x-auto">
                        {tc.inputData}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-gray-400 italic text-[11px]">(No input required)</div>
                  )}

                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block mb-0.5">Expected Output:</span>
                    <pre className="bg-[#0d1117] p-2 rounded border border-[#30363d] font-mono text-blue-400 overflow-x-auto">
                      {tc.expectedOutput}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progressive Hints Accordion */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#30363d]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>Progressive Hints</span>
                </div>
                {revealedHints < problem.hints.length && (
                  <button
                    onClick={() => setRevealedHints((prev) => prev + 1)}
                    className="text-xs bg-[#21262d] hover:bg-[#30363d] text-amber-300 px-2.5 py-1 rounded border border-amber-500/30 transition-colors"
                  >
                    Reveal Hint {revealedHints + 1}
                  </button>
                )}
              </div>

              {revealedHints === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Stuck? Click "Reveal Hint" to unlock subtle guidance without giving away the full solution.
                </p>
              ) : (
                <div className="space-y-2">
                  {problem.hints.slice(0, revealedHints).map((hint: any, idx: number) => (
                    <div
                      key={hint.id || idx}
                      className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200/90 leading-relaxed"
                    >
                      <strong className="text-amber-400">Hint {idx + 1}:</strong> {hint.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Monaco Code Editor + Output Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-[#161b22] overflow-hidden">
          {/* Action Toolbar */}
          <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-gray-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                solution.py
              </span>
              <button
                onClick={handleResetCode}
                title="Reset to starter code"
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#21262d] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Run, Debug, and Submit buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunCode(false)}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                Run Code
              </button>

              <button
                onClick={handleDebugCode}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Bug className="w-3.5 h-3.5 text-amber-400" />
                Debug
              </button>

              <button
                onClick={handleSubmit}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-semibold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 hover:scale-105"
              >
                <Send className="w-3.5 h-3.5" />
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative min-h-[300px]">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "Fira Code, Consolas, Monaco, monospace",
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Bottom Interactive Results & Console Drawer */}
          <div className="h-64 border-t border-[#30363d] bg-[#0d1117] flex flex-col flex-shrink-0">
            {/* Console Drawer Tabs */}
            <div className="bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("console")}
                  className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "console"
                      ? "border-blue-500 text-white bg-[#0d1117]/50"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Console Output
                </button>

                <button
                  onClick={() => setActiveTab("tests")}
                  className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "tests"
                      ? "border-blue-500 text-white bg-[#0d1117]/50"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Test Evaluation
                  {evaluationResult && (
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        evaluationResult.overallStatus === "ACCEPTED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {evaluationResult.passedCount}/{evaluationResult.totalCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("debug")}
                  className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "debug"
                      ? "border-blue-500 text-white bg-[#0d1117]/50"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <Bug className="w-3.5 h-3.5 text-amber-400" />
                  Debug Inspector
                  {debugAnalysis?.hasError && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("customInput")}
                  className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "customInput"
                      ? "border-blue-500 text-white bg-[#0d1117]/50"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  Custom Input
                </button>
              </div>

              {executionMs !== null && (
                <div className="flex items-center gap-1 text-gray-400 font-mono text-[11px] pr-2">
                  <Clock className="w-3 h-3" />
                  <span>{executionMs} ms</span>
                </div>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-3 overflow-y-auto text-xs font-mono">
              {/* TAB 1: CONSOLE OUTPUT */}
              {activeTab === "console" && (
                <div className="space-y-2">
                  {stdout && (
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block mb-1">Standard Output:</span>
                      <pre className="text-gray-200 whitespace-pre-wrap">{stdout}</pre>
                    </div>
                  )}

                  {stderr && (
                    <div className="mt-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <span className="text-[10px] uppercase text-red-400 font-bold block mb-1">
                        Execution Error:
                      </span>
                      <pre className="text-red-300 whitespace-pre-wrap">{stderr}</pre>
                    </div>
                  )}

                  {!stdout && !stderr && !isExecuting && (
                    <div className="text-gray-400 italic">
                      Click ▶ Run Code to execute against sample inputs, or 🚀 Submit to run all test cases.
                    </div>
                  )}

                  {isExecuting && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Executing Python code in isolated sandbox...</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TEST EVALUATION */}
              {activeTab === "tests" && (
                <div>
                  {!evaluationResult ? (
                    <div className="text-gray-400 italic">
                      No evaluation yet. Click 🚀 Submit to evaluate this problem against all visible and hidden test cases.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-bold ${
                              evaluationResult.overallStatus === "ACCEPTED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-red-500/20 text-red-400 border border-red-500/40"
                            }`}
                          >
                            {evaluationResult.overallStatus}
                          </span>
                          <span className="text-gray-300 font-sans text-xs">
                            Passed {evaluationResult.passedCount} of {evaluationResult.totalCount} tests
                          </span>
                        </div>
                        <span className="text-gray-400 text-[11px]">
                          Max Runtime: {evaluationResult.maxExecutionMs} ms
                        </span>
                      </div>

                      <div className="grid gap-2">
                        {evaluationResult.results?.map((res: any, idx: number) => {
                          const isPass = res.status === "PASSED";
                          const isVisible = res.type === "VISIBLE";

                          return (
                            <div
                              key={res.testCaseId || idx}
                              className={`p-2.5 rounded-lg border text-xs ${
                                isPass
                                  ? "bg-emerald-950/10 border-emerald-500/30 text-gray-200"
                                  : "bg-red-950/10 border-red-500/30 text-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">
                                    Test {idx + 1}{" "}
                                    <span className="text-[10px] font-normal text-gray-400">
                                      ({isVisible ? "Sample" : "Hidden"})
                                    </span>
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      isPass ? "text-emerald-400" : "text-red-400"
                                    }`}
                                  >
                                    {res.status}
                                  </span>
                                </div>
                                <span className="text-gray-400 text-[11px] font-mono">
                                  {res.executionMs} ms
                                </span>
                              </div>

                              {/* Only show input/expected/actual for VISIBLE tests */}
                              {isVisible && !isPass && (
                                <div className="mt-2 space-y-1 bg-[#0d1117] p-2 rounded border border-[#30363d]">
                                  {res.input && <div>Input: <span className="text-gray-300">{res.input}</span></div>}
                                  {res.expected && <div>Expected: <span className="text-blue-400">{res.expected}</span></div>}
                                  {res.actual && <div>Actual Output: <span className="text-red-400">{res.actual}</span></div>}
                                  {res.error && <div className="text-red-400">Error: {res.error}</div>}
                                </div>
                              )}

                              {!isVisible && !isPass && (
                                <div className="text-gray-400 text-[11px] italic mt-1">
                                  Hidden test input and expected output are protected for assessment integrity.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DEBUG INSPECTOR */}
              {activeTab === "debug" && (
                <div className="space-y-3">
                  {!debugAnalysis || !debugAnalysis.hasError ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300">
                      ✓ No syntax or runtime errors detected in current run. Your code executed successfully!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-red-400 text-sm">
                            {debugAnalysis.errorType || "Error Detected"}
                          </span>
                          {debugAnalysis.lineNumber && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-xs">
                              Line {debugAnalysis.lineNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-200 mt-1">{debugAnalysis.message}</p>
                      </div>

                      {debugAnalysis.codeSnippet && (
                        <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-lg">
                          <span className="text-[10px] uppercase text-gray-400 block mb-1">Offending Line:</span>
                          <pre className="text-amber-300 bg-[#0d1117] p-2 rounded border border-[#30363d]">
                            {debugAnalysis.lineNumber ? `${debugAnalysis.lineNumber}: ` : ""}{debugAnalysis.codeSnippet}
                          </pre>
                        </div>
                      )}

                      <div className="bg-[#161b22] border border-blue-500/30 p-3 rounded-lg space-y-1.5">
                        <span className="font-semibold text-blue-400 block">💡 Learner Diagnosis:</span>
                        <p className="text-gray-300 leading-relaxed font-sans text-xs">
                          {debugAnalysis.friendlyExplanation}
                        </p>
                        {debugAnalysis.suggestion && (
                          <div className="mt-2 text-emerald-400 font-sans text-xs">
                            <strong>How to fix:</strong> {debugAnalysis.suggestion}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CUSTOM INPUT */}
              {activeTab === "customInput" && (
                <div className="space-y-3">
                  <div className="text-gray-300 text-xs">
                    Supply custom multi-line standard input for your program:
                  </div>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    rows={4}
                    placeholder="Enter input lines here..."
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleRunCode(true)}
                    disabled={isExecuting}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Run with Custom Input
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LEVEL COMPLETED CELEBRATION MODAL */}
      {unlockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161b22] border border-emerald-500/50 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-500 p-1 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <div className="w-full h-full bg-[#0d1117] rounded-xl flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <h3 className="text-2xl font-extrabold text-white">
              Level {levelNum} Completed! 🎉
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Congratulations! You have satisfied all test requirements for all 5 problems in{" "}
              <strong className="text-white">Level {levelNum}: {problem.level?.title}</strong>.
            </p>

            {unlockModal.nextLevel && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 font-semibold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Level {unlockModal.nextLevel} is now Unlocked!
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              {unlockModal.nextLevel ? (
                <Link
                  href={`/workspace/PY-L${String(unlockModal.nextLevel).padStart(2, "0")}-P01`}
                  onClick={() => setUnlockModal({ ...unlockModal, isOpen: false })}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  Advance to Level {unlockModal.nextLevel}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : null}

              <Link
                href="/roadmap"
                onClick={() => setUnlockModal({ ...unlockModal, isOpen: false })}
                className="w-full bg-[#21262d] hover:bg-[#30363d] text-gray-200 font-semibold py-2 rounded-lg text-xs transition-colors"
              >
                View Updated Roadmap
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
