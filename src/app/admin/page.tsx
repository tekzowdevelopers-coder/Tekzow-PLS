"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
  Activity,
  FileCode,
  ArrowRight,
  Database,
  ExternalLink,
} from "lucide-react";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetEmail, setResetEmail] = useState("student@example.com");
  const [resetMessage, setResetMessage] = useState("");
  const [resetting, setResetting] = useState(false);
  const [levels, setLevels] = useState<any[]>([]);

  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/submissions").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/levels").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([subData, lvlData]) => {
        setData(subData);
        setLevels(lvlData?.levels || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResetProgress = async () => {
    if (!confirm(`Are you sure you want to reset all progress for ${resetEmail}? Only Level 1 will remain unlocked.`)) {
      return;
    }
    setResetting(true);
    setResetMessage("");
    try {
      const res = await fetch("/api/admin/reset-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const result = await res.json();
      if (res.ok) {
        setResetMessage(result.message || "Progress reset successfully.");
        fetchAdminData();
      } else {
        setResetMessage(result.error || "Failed to reset progress.");
      }
    } catch (err: any) {
      setResetMessage(err.message || "Error resetting progress.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading admin management panel...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || { total: 0, accepted: 0, wrongAnswer: 0, runtimeError: 0, acceptanceRate: 0 };
  const submissions = data?.submissions || [];

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161b22] border border-purple-500/30 rounded-2xl p-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold mb-2 border border-purple-500/30">
            <Shield className="w-3.5 h-3.5" />
            Instructor & Administrator Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Platform Management & Evaluation Metrics
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Monitor student submissions, diagnose failure patterns, and manage curriculum access.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* Analytics KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <span className="text-xs uppercase font-semibold text-gray-400 block mb-1">Total Submissions</span>
          <span className="text-3xl font-bold text-white">{stats.total}</span>
          <span className="text-xs text-gray-400 block mt-1">All time evaluations</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <span className="text-xs uppercase font-semibold text-gray-400 block mb-1">Accepted Solutions</span>
          <span className="text-3xl font-bold text-emerald-400">{stats.accepted}</span>
          <span className="text-xs text-emerald-400/80 block mt-1 font-mono">
            {stats.acceptanceRate}% Acceptance Rate
          </span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <span className="text-xs uppercase font-semibold text-gray-400 block mb-1">Wrong Answers</span>
          <span className="text-3xl font-bold text-amber-400">{stats.wrongAnswer}</span>
          <span className="text-xs text-gray-400 block mt-1">Output mismatch</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <span className="text-xs uppercase font-semibold text-gray-400 block mb-1">Runtime Errors</span>
          <span className="text-3xl font-bold text-red-400">{stats.runtimeError}</span>
          <span className="text-xs text-gray-400 block mt-1">Exceptions & timeouts</span>
        </div>
      </div>

      {/* Reset Student Progress Utility */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <RotateCcw className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Student Progress Reset Utility</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Reset any student's progression back to Level 1. Ideal for verifying the level unlock pipeline from scratch.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="student@example.com"
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleResetProgress}
            disabled={resetting}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            {resetting ? "Resetting..." : "Reset Progress"}
          </button>
        </div>

        {resetMessage && (
          <div className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
            {resetMessage}
          </div>
        )}
      </div>

      {/* Recent Submissions Feed */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Live Student Submissions Log</h2>
          </div>
          <span className="text-xs text-gray-400 font-mono">Showing latest 50</span>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No submissions recorded yet. Open the workspace to submit student code.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400 border-b border-[#30363d]">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Problem</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Passed</th>
                  <th className="py-2.5 px-3">Execution Time</th>
                  <th className="py-2.5 px-3">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/50">
                {submissions.map((sub: any) => {
                  const isAccepted = sub.status === "ACCEPTED";
                  return (
                    <tr key={sub.id} className="hover:bg-[#21262d]/40 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-medium text-white block">{sub.user?.name}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{sub.user?.email}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-200 block">{sub.problem?.title}</span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Level {sub.problem?.level?.number} • {sub.problemId}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            isAccepted
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-300 font-mono">
                        {sub.passedCount} / {sub.totalCount}
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-400 font-mono">
                        {sub.executionMs} ms
                      </td>
                      <td className="py-3 px-3">
                        <Link
                          href={`/workspace/${sub.problemId}`}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          Inspect <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Curriculum Catalog (20 Levels & 100 Problems) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Curriculum Problem Catalog (20 Levels, 100 Problems)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {levels.map((lvl: any) => (
            <div
              key={lvl.levelId || lvl.number}
              className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3.5 text-xs hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-purple-400">Level {lvl.number}</span>
                <span className="text-[10px] text-gray-400 font-mono">5 Problems</span>
              </div>
              <h3 className="font-semibold text-white truncate">{lvl.title}</h3>
              <p className="text-gray-400 text-[11px] line-clamp-1 mt-1">{lvl.objective}</p>
              <div className="mt-2.5 pt-2 border-t border-[#30363d]/60 flex items-center justify-between">
                <Link
                  href={`/workspace/PY-L${String(lvl.number).padStart(2, "0")}-P01`}
                  className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1 font-medium"
                >
                  P01 Workspace <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
