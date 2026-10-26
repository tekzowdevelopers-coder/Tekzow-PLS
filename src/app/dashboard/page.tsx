"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Flame,
  ArrowRight,
  Trophy,
  Award,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    fetch("/api/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  const progress = data?.progress;
  const recentSubmissions = data?.recentSubmissions || [];

  const currentLevelSummary = progress?.levels?.find(
    (l: any) => l.number === progress?.currentLevelNumber
  );

  const milestones = progress?.levels?.filter((l: any) => l.isMilestone) || [];

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-[#161b22] border border-blue-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mb-3 border border-blue-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Learning Journey in Progress
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, Python Explorer!
          </h1>
          <p className="text-sm text-gray-300 mt-2">
            You are currently working on{" "}
            <span className="text-white font-semibold">
              Level {progress?.currentLevelNumber}: {currentLevelSummary?.title}
            </span>
            . Complete all 5 required problems to unlock the next level.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/workspace/PY-L${String(progress?.currentLevelNumber || 1).padStart(2, "0")}-P01`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 text-amber-300 fill-amber-300" />
              Resume Level {progress?.currentLevelNumber} Workspace
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/roadmap"
              className="inline-flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              View Full Roadmap
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Problems Solved */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-semibold">Overall Problems</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{progress?.totalAccepted || 0}</span>
            <span className="text-xs text-gray-400">/ {progress?.totalProblems || 100} Solved</span>
          </div>
          <div className="w-full bg-[#0d1117] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round(((progress?.totalAccepted || 0) / (progress?.totalProblems || 100)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Current Level Progress */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-semibold">Current Level</span>
            <Code2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-400">{currentLevelSummary?.acceptedCount || 0}</span>
            <span className="text-xs text-gray-400">/ {currentLevelSummary?.totalCount || 5} Accepted</span>
          </div>
          <div className="w-full bg-[#0d1117] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round(((currentLevelSummary?.acceptedCount || 0) / (currentLevelSummary?.totalCount || 5)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Levels Completed */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-semibold">Levels Completed</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{progress?.completedLevelsCount || 0}</span>
            <span className="text-xs text-gray-400">/ 20 Levels</span>
          </div>
          <div className="w-full bg-[#0d1117] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round(((progress?.completedLevelsCount || 0) / 20) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Unlocked Levels */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-semibold">Unlocked Access</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">{progress?.unlockedLevelsCount || 1}</span>
            <span className="text-xs text-gray-400">/ 20 Accessible</span>
          </div>
          <div className="w-full bg-[#0d1117] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round(((progress?.unlockedLevelsCount || 1) / 20) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Milestone Assignments Section */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Milestone Capstone Assignments</h2>
          </div>
          <span className="text-xs text-gray-400">Levels 5, 10, 15, and 20</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {milestones.map((m: any) => {
            const isCompleted = m.status === "COMPLETED";
            const isUnlocked = m.status === "UNLOCKED";
            return (
              <div
                key={m.levelId}
                className={`p-4 rounded-xl border ${
                  isCompleted
                    ? "bg-emerald-950/20 border-emerald-500/40"
                    : isUnlocked
                    ? "bg-blue-950/20 border-blue-500/40"
                    : "bg-[#0d1117]/60 border-[#30363d] opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-gray-300">Level {m.number}</span>
                  {isCompleted ? (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Completed
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-gray-400 bg-[#21262d] px-2 py-0.5 rounded">
                      Locked
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-white">{m.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {m.acceptedCount}/{m.totalCount} problems accepted
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-white">Recent Evaluation Activity</h2>
          </div>
          <button
            onClick={fetchDashboardData}
            title="Refresh submissions"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#21262d] rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400 bg-[#0d1117]/50 rounded-xl border border-[#30363d]">
            No recent submissions yet. Open the workspace to write and submit your first Python solution!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400 border-b border-[#30363d]">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Problem</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Tests</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/50">
                {recentSubmissions.map((sub: any) => {
                  const isAccepted = sub.status === "ACCEPTED";
                  return (
                    <tr key={sub.id} className="hover:bg-[#21262d]/40 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            isAccepted
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {isAccepted ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-white">{sub.problem?.title}</td>
                      <td className="py-3 px-3 text-xs text-gray-400 font-mono">
                        Level {sub.problem?.level?.number}
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-300 font-mono">
                        {sub.passedCount} / {sub.totalCount} passed
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-400 font-mono">
                        {sub.executionMs} ms
                      </td>
                      <td className="py-3 px-3">
                        <Link
                          href={`/workspace/${sub.problemId}`}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                        >
                          Workspace <ArrowRight className="w-3 h-3" />
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
    </div>
  );
}
