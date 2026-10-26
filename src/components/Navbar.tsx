"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Code2, BookOpen, Map, Shield, User, LogOut, CheckCircle, Flame } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [progressSummary, setProgressSummary] = useState<{ totalAccepted: number; currentLevel: number } | null>(null);

  useEffect(() => {
    // Fetch auth status
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    // Fetch brief progress
    fetch("/api/levels")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.summary) {
          setProgressSummary({
            totalAccepted: data.summary.totalAccepted,
            currentLevel: data.summary.currentLevelNumber,
          });
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur border-b border-[#30363d] px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0d1117] rounded-[7px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-blue-400 group-hover:text-amber-400 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
              PyPractical
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v1.0
              </span>
            </span>
            <span className="text-xs text-gray-400 font-mono">20 Levels • 100 Problems</span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            href="/roadmap"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname === "/roadmap"
                ? "bg-[#21262d] text-white border border-[#30363d]"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]/50"
            }`}
          >
            <Map className="w-4 h-4 text-emerald-400" />
            Roadmap
          </Link>

          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname === "/dashboard"
                ? "bg-[#21262d] text-white border border-[#30363d]"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]/50"
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            Dashboard
          </Link>

          <Link
            href="/workspace/PY-L01-P01"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname?.startsWith("/workspace")
                ? "bg-[#21262d] text-white border border-[#30363d]"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]/50"
            }`}
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            Workspace
          </Link>

          {currentUser?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === "/admin"
                  ? "bg-[#21262d] text-white border border-[#30363d]"
                  : "text-gray-400 hover:text-white hover:bg-[#21262d]/50"
              }`}
            >
              <Shield className="w-4 h-4 text-purple-400" />
              Admin
            </Link>
          )}
        </nav>

        {/* User / Progress quick view */}
        <div className="flex items-center gap-3">
          {progressSummary && (
            <div className="hidden sm:flex items-center gap-3 bg-[#0d1117] border border-[#30363d] px-3 py-1 rounded-full text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                {progressSummary.totalAccepted}/100 Solved
              </span>
              <span className="text-[#30363d]">|</span>
              <span className="flex items-center gap-1 text-blue-400 font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Level {progressSummary.currentLevel}
              </span>
            </div>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[#21262d] px-2.5 py-1 rounded-md border border-[#30363d] text-xs">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-gray-200 font-medium">{currentUser.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">({currentUser.role})</span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#21262d] rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-md transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
