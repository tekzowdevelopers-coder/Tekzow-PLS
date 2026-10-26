import Link from "next/link";
import {
  Code2,
  Terminal,
  Bug,
  Trophy,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Layers,
  Award,
} from "lucide-react";

export default function HomePage() {
  const curriculumHighlights = [
    { lvl: "1–5", title: "Foundations & Conditions", topics: "I/O, Variables, Math Operators, If/Else", milestone: "Student Result Management" },
    { lvl: "6–10", title: "Loops & Number Algorithms", topics: "Counters, Patterns, Primes, Collatz", milestone: "Comprehensive Number Analyzer" },
    { lvl: "11–15", title: "Strings & Linear Collections", topics: "Slicing, Anagrams, Frequency, Search", milestone: "Student Marks Analyzer" },
    { lvl: "16–20", title: "Data Structures & Functions", topics: "Tuples, Sets, Dictionaries, Exceptions", milestone: "Full Student Management System" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 border-b border-[#30363d]/60 bg-gradient-to-b from-[#161b22] to-[#0d1117]">
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            V1.0 • 20 Levels • 100 Progressive Coding Problems
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Learn Python by Solving Real Problems in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400">
              One Unified Workspace
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            No installation required. Read concepts, write code in Monaco Editor, execute in an isolated sandbox,
            debug with intelligent diagnostic hints, and unlock progressive levels.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/workspace/PY-L01-P01"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-6 py-3.5 rounded-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <Code2 className="w-5 h-5 text-amber-300" />
              Start Coding Level 1
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] font-semibold px-6 py-3.5 rounded-lg transition-all"
            >
              <Layers className="w-5 h-5 text-emerald-400" />
              Explore 20-Level Roadmap
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm px-4 py-2 transition-colors"
            >
              Sign In with Demo Account &rarr;
            </Link>
          </div>

          {/* Key Metric Badges */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-[#161b22]/80 border border-[#30363d] rounded-xl p-4 text-center">
              <span className="text-3xl font-bold text-white block">20</span>
              <span className="text-xs text-gray-400">Progressive Levels</span>
            </div>
            <div className="bg-[#161b22]/80 border border-[#30363d] rounded-xl p-4 text-center">
              <span className="text-3xl font-bold text-blue-400 block">100</span>
              <span className="text-xs text-gray-400">Handcrafted Problems</span>
            </div>
            <div className="bg-[#161b22]/80 border border-[#30363d] rounded-xl p-4 text-center">
              <span className="text-3xl font-bold text-amber-400 block">4</span>
              <span className="text-xs text-gray-400">Milestone Capstones</span>
            </div>
            <div className="bg-[#161b22]/80 border border-[#30363d] rounded-xl p-4 text-center">
              <span className="text-3xl font-bold text-emerald-400 block">320+</span>
              <span className="text-xs text-gray-400">Automated Test Cases</span>
            </div>
          </div>
        </div>
      </section>

      {/* Student Journey Pipeline */}
      <section className="py-16 bg-[#0d1117] border-b border-[#30363d]/60">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              The Interactive Student Learning Journey
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-400">
              A frictionless feedback loop designed to build real intuition and independent debugging skills.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 relative overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
                <span className="text-blue-400 font-mono font-bold">01</span>
              </div>
              <h3 className="font-semibold text-white text-base mb-1">Concept & Example</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Read concise theory, inspect input/output formats, and review worked sample demonstrations.
              </p>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 relative overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
                <span className="text-indigo-400 font-mono font-bold">02</span>
              </div>
              <h3 className="font-semibold text-white text-base mb-1">Code & Run</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Write solution in Monaco Editor and run against sample inputs with real-time stdout/stderr.
              </p>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 relative overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <span className="text-amber-400 font-mono font-bold">03</span>
              </div>
              <h3 className="font-semibold text-white text-base mb-1">Intelligent Debug</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Hit syntax or runtime errors? Our debugger pinpoints the failing line with beginner explanations.
              </p>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 relative overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                <span className="text-emerald-400 font-mono font-bold">04</span>
              </div>
              <h3 className="font-semibold text-white text-base mb-1">Submit & Unlock</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pass visible and hidden test suites. Complete all 5 problems to unlock the next level.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Roadmap Teaser */}
      <section className="py-16 bg-[#161b22]/50 border-b border-[#30363d]/60">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Curriculum Roadmap</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">4 Distinct Learning Stages</h2>
            </div>
            <Link
              href="/roadmap"
              className="mt-4 md:mt-0 text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Full 20 Levels <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {curriculumHighlights.map((block, idx) => (
              <div
                key={idx}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Levels {block.lvl}
                  </span>
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Milestone
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{block.title}</h3>
                <p className="text-xs text-gray-400 mb-4">{block.topics}</p>
                <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-gray-300 font-medium">Assignment: {block.milestone}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">100% Required</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#0d1117] text-center text-xs text-gray-400 border-t border-[#30363d]/40">
        <p>Python Practical Learning Platform (V1.0) • Complete Beginner to Intermediate Curriculum</p>
      </footer>
    </div>
  );
}
