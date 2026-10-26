"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronRight,
  Code2,
  Trophy,
  ArrowRight,
  Award,
  Sparkles,
  Play,
  RotateCcw,
} from "lucide-react";

export default function RoadmapPage() {
  const [levels, setLevels] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});
  const [levelDetails, setLevelDetails] = useState<Record<number, any>>({});

  const fetchRoadmap = () => {
    setLoading(true);
    fetch("/api/levels")
      .then((res) => res.json())
      .then((data) => {
        setLevels(data.levels || []);
        setSummary(data.summary || null);
        // Expand currently active level by default
        if (data.summary?.currentLevelNumber) {
          setExpandedLevels({ [data.summary.currentLevelNumber]: true });
          fetchLevelDetail(data.summary.currentLevelNumber);
        } else {
          setExpandedLevels({ 1: true });
          fetchLevelDetail(1);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchLevelDetail = (levelNum: number) => {
    if (levelDetails[levelNum]) return;
    fetch(`/api/levels/${levelNum}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.level) {
          setLevelDetails((prev) => ({ ...prev, [levelNum]: data.level }));
        }
      })
      .catch(console.error);
  };

  const toggleLevel = (levelNum: number, isLocked: boolean) => {
    if (isLocked) return;
    setExpandedLevels((prev) => {
      const nextState = !prev[levelNum];
      if (nextState) fetchLevelDetail(levelNum);
      return { ...prev, [levelNum]: nextState };
    });
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading 20-Level Roadmap...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2 border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Linear Progression System
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Python Mastery Roadmap (20 Levels)
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Complete all 5 required problems in each level to unlock the subsequent level.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#0d1117] border border-[#30363d] px-4 py-3 rounded-xl">
          <div className="text-center">
            <span className="text-xs text-gray-400 block">Overall Solved</span>
            <span className="text-lg font-bold text-emerald-400">
              {summary?.totalAccepted || 0}/100
            </span>
          </div>
          <div className="h-8 w-px bg-[#30363d]" />
          <div className="text-center">
            <span className="text-xs text-gray-400 block">Current Level</span>
            <span className="text-lg font-bold text-blue-400">
              Level {summary?.currentLevelNumber || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Levels Timeline List */}
      <div className="space-y-3">
        {levels.map((lvl) => {
          const isCompleted = lvl.status === "COMPLETED";
          const isUnlocked = lvl.status === "UNLOCKED";
          const isLocked = lvl.status === "LOCKED";
          const isExpanded = !!expandedLevels[lvl.number];
          const detail = levelDetails[lvl.number];

          return (
            <div
              key={lvl.levelId || lvl.number}
              className={`rounded-xl border transition-all ${
                isCompleted
                  ? "bg-[#161b22] border-emerald-500/30"
                  : isUnlocked
                  ? "bg-[#161b22] border-blue-500/50 shadow-lg shadow-blue-500/5"
                  : "bg-[#161b22]/50 border-[#30363d]/60 opacity-60"
              }`}
            >
              {/* Level Row Header */}
              <div
                onClick={() => toggleLevel(lvl.number, isLocked)}
                className={`p-4 flex items-center justify-between cursor-pointer select-none ${
                  isLocked ? "cursor-not-allowed" : "hover:bg-[#21262d]/40"
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Status Indicator Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                      isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : isUnlocked
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse-subtle"
                        : "bg-[#21262d] text-gray-400 border border-[#30363d]"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                      String(lvl.number).padStart(2, "0")
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">
                        Level {lvl.number}: {lvl.title}
                      </h3>
                      {lvl.isMilestone && (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Milestone
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{lvl.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Problem count / completion status */}
                  <div className="text-right hidden sm:block">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : isUnlocked
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          : "bg-[#21262d] text-gray-400"
                      }`}
                    >
                      {isCompleted
                        ? "5/5 Completed"
                        : isUnlocked
                        ? `${lvl.acceptedCount || 0}/5 In Progress`
                        : "Locked"}
                    </span>
                  </div>

                  {/* Expand Chevron */}
                  {!isLocked && (
                    <div className="text-gray-400 hover:text-white transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Problems List */}
              {isExpanded && !isLocked && (
                <div className="border-t border-[#30363d] p-4 bg-[#0d1117]/60 space-y-2 rounded-b-xl">
                  {detail?.assignment && (
                    <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-amber-300">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>
                          <strong>Milestone Assignment:</strong> {detail.assignment.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        {detail.assignment.passRule}
                      </span>
                    </div>
                  )}

                  <div className="grid gap-2">
                    {detail?.problems?.map((prob: any) => {
                      const isProbAccepted = prob.status === "ACCEPTED";
                      const isProbAttempted = prob.status === "ATTEMPTED";

                      return (
                        <div
                          key={prob.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-blue-500/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono ${
                                isProbAccepted
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-[#21262d] text-gray-400"
                              }`}
                            >
                              {isProbAccepted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                prob.orderIndex
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white text-sm">
                                  {prob.title}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-gray-400">
                                  {prob.difficulty}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">{prob.concept}</span>
                            </div>
                          </div>

                          <Link
                            href={`/workspace/${prob.id}`}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              isProbAccepted
                                ? "bg-[#21262d] hover:bg-[#30363d] text-gray-200"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                            }`}
                          >
                            {isProbAccepted ? "Review Code" : "Solve Problem"}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
