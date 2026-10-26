"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, User, Shield, Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPass: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: userPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <div className="w-full h-full bg-[#0d1117] rounded-[10px] flex items-center justify-center">
              <Code2 className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? "Create Student Account" : "Sign In to PyPractical"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Access 20 progressive Python levels & 100 practice problems.
          </p>
        </div>

        {/* 1-Click Demo Buttons */}
        <div className="mb-6 space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">
            ⚡ 1-Click Quick Demo Sign In
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("student@example.com", "password123")}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] rounded-lg p-2.5 text-xs font-semibold transition-all hover:border-blue-500/50"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              Demo Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@example.com", "admin123")}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] rounded-lg p-2.5 text-xs font-semibold transition-all hover:border-purple-500/50"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Platform Admin
            </button>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#30363d]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#161b22] px-2 text-gray-400">or sign in with credentials</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Register as Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
