import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ShieldCheck, Users, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import supabase from "../utils/supabase";

localStorage.removeItem('hasSeenLanguageHint');

const Login = () => {
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 🔹 1. Fetch user from Supabase
      const { data: users, error } = await supabase
        .from("users_hr")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

      if (error || !users) {
        toast.error("Invalid credentials");
        setSubmitting(false);
        return;
      }

      // 🔹 2. Check access
      if (users.access === false) {
        toast.error("Employee access has been deactivated");
        setSubmitting(false);
        return;
      }

      // 🔹 3. Success login
      toast.success("Login successful!");
      localStorage.setItem("user", JSON.stringify(users));
      login(users);

      // 🔹 4. Role based navigation
      const role = users.role ? users.role.toLowerCase() : "user";

      if (role === "admin") {
        navigate("/", { replace: true });
      } else {
        navigate("/my-profile", { replace: true });
      }

    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F172A] relative overflow-hidden font-sans p-4">
      {/* Decorative blurred background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-6xl min-h-[650px] bg-[#1E293B]/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 transition-transform duration-300 hover:scale-[1.002]">
        
        {/* LEFT BRANDING PANEL (40% width on md+) */}
        <div className="w-full md:w-[40%] bg-gradient-to-br from-[#065F46] via-[#0F766E] to-[#0F172A] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-700/30">
          {/* Subtle background mesh illustration */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Branding Content */}
          <div className="relative z-10">
            {/* Logo container with a clean white glass bg */}
            <div className="h-16 w-40 flex items-center justify-center bg-white rounded-2xl p-3 shadow-lg border border-white/20 transition-transform duration-300 hover:scale-105">
              <img
                src="/Logo.PNG"
                alt="Logo"
                className="h-full w-auto object-contain"
              />
            </div>
            <div className="mt-10 md:mt-16 space-y-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                Human Resource & <br />
                <span className="text-[#34D399]">Employee Management</span> System
              </h1>
              <div className="h-1 w-12 bg-[#34D399] rounded-full"></div>
              <p className="text-sm text-emerald-100/90 leading-relaxed font-light">
                Smart Workforce & File Management Platform. Streamlining operations, employee performance tracking, and secure document vaults.
              </p>
            </div>
          </div>

          {/* Feature List/Icons for branding */}
          <div className="mt-8 md:mt-0 relative z-10 space-y-4">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10">
              <div className="p-2 bg-emerald-500/20 text-[#34D399] rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Employee Management</p>
                <p className="text-[10px] text-emerald-200/70">Attendance, payroll, resignations, and directory</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10">
              <div className="p-2 bg-teal-500/20 text-[#22D3EE] rounded-xl">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Document Management</p>
                <p className="text-[10px] text-teal-200/70">Centralized document upload, sharing, and folder views</p>
              </div>
            </div>
          </div>

         
        </div>

        {/* RIGHT LOGIN FORM AREA (60% width on md+) */}
        <div className="w-full md:w-[60%] p-8 md:p-16 flex flex-col justify-between bg-[#0F172A]/70 backdrop-blur-md">
          <div className="max-w-md w-full mx-auto my-auto space-y-8">
            
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-[#34D399] rounded-full text-xs font-medium mb-3 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authorized Personnel Only</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Sign in to access your HR & File Management Dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#34D399] transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full pl-11 pr-4 py-3 bg-[#1E293B]/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/50 focus:border-[#0F766E] transition-all hover:border-slate-600 focus:bg-[#1E293B]"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#34D399] transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-11 py-3 bg-[#1E293B]/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/50 focus:border-[#0F766E] transition-all hover:border-slate-600 focus:bg-[#1E293B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Additional controls (Remember me / Forgot password mockup) */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-[#0F766E] focus:ring-[#0F766E] focus:ring-offset-slate-900"
                    />
                    <span>Remember me</span>
                  </label>
                 
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] shadow-lg hover:shadow-emerald-950/20 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[#34D399] transition-all duration-200 ${
                    submitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="text-[#34D399]">🔒</span>
            <span>Enterprise-grade Security. Your data is protected and encrypted.</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;

