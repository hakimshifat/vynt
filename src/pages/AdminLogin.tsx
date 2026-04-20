/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { useAdmin } from "../AdminContext";

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const { login, isAdmin } = useAdmin();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAdmin) navigate("/admin");
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(password);
    if (success) {
      navigate("/admin");
    } else {
      setError("Incorrect password. Access denied.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a2e] relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <motion.div
          animate={isShaking ? {
            x: [-8, 8, -8, 8, -4, 4, 0],
            transition: { duration: 0.4 }
          } : {}}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-blue-500 rounded-2xl mb-5 shadow-lg shadow-violet-500/25">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Admin Access</h1>
            <p className="text-white/40 text-sm mt-2 font-medium">VYNT Store Management Portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock size={16} />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-11 pr-11 py-3.5 text-sm font-medium outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all placeholder-white/20"
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </motion.div>
            )}

            <button
              id="admin-login-btn"
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-sm uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-[0.98] mt-2"
            >
              Access Dashboard
            </button>
          </form>

          {/* Back link */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium"
            >
              ← Back to Store
            </button>
          </div>
        </motion.div>

        {/* Security notice */}
        <p className="text-center text-white/15 text-[10px] mt-4 font-mono tracking-wider">
          AUTHORIZED PERSONNEL ONLY • VYNT MANAGEMENT SYSTEM
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
