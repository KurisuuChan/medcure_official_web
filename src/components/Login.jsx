import React, { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn, Shield, User, Lock, Cross } from "lucide-react";
import { simpleSignIn, simpleGetCurrentUser } from "../services/simpleAuthService.js";
import PropTypes from "prop-types";
import "./login-animations.css";

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quick login presets
  const quickLogins = {
    admin: {
      email: "admin@medcure.com",
      password: "123456",
      label: "Admin",
      icon: Shield,
    },
    employee: {
      email: "cashier@medcure.com",
      password: "123456",
      label: "Staff",
      icon: User,
    },
  };

  // Check if already logged in
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const userInfo = await simpleGetCurrentUser();
        if (userInfo) {
          onLoginSuccess(userInfo);
        }
      } catch (error) {
        console.log("ℹ️ No existing session found:", error.message);
        // This is normal for users who aren't logged in yet
      }
    };
    checkCurrentUser();
  }, [onLoginSuccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await simpleSignIn(formData.email, formData.password);

      if (result.success) {
        console.log("✅ Login successful:", result.role);
        onLoginSuccess({
          user: result.user,
          role: result.role,
        });
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (type) => {
    const credentials = quickLogins[type];
    setFormData({
      email: credentials.email,
      password: credentials.password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Medical Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-medical-pattern"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding & Info (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col justify-center text-white">
          <div className="space-y-8">
            <div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
                MedCure
              </h1>
              <p className="text-xl text-blue-100 font-light">
                Advanced Pharmacy Management System
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mt-6"></div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Cross className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Medical Grade Security
                  </h3>
                  <p className="text-blue-200 text-sm">
                    HIPAA compliant and secure
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Role-Based Access
                  </h3>
                  <p className="text-blue-200 text-sm">
                    Secure multi-user system
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <User className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    User Friendly
                  </h3>
                  <p className="text-blue-200 text-sm">
                    Intuitive and modern interface
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:max-w-none">
          <div className="login-card bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative">
            {/* Card Header with Logo */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-8 sm:px-10 sm:py-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 sm:mb-6 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Cross className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:hidden font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2">
                  MedCure
                </h1>
                <div className="lg:hidden">
                  <p className="text-slate-600 text-sm sm:text-base font-medium mb-4">
                    Pharmacy Management System
                  </p>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div className="px-8 pb-8 sm:px-10 sm:pb-10">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                  Welcome Back
                </h2>
                <p className="text-slate-600">
                  Sign in to access your dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="form-field group">
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold text-slate-700 mb-3 tracking-wide"
                  >
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-4 text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-slate-400 hover:border-slate-300 text-sm sm:text-base"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-field group">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-slate-700 mb-3 tracking-wide"
                  >
                    PASSWORD
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-14 py-4 text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-slate-400 hover:border-slate-300 text-sm sm:text-base"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-xl">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-2xl font-bold text-base sm:text-lg focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative overflow-hidden group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <LogIn size={22} />
                      <span>Sign In to Dashboard</span>
                    </div>
                  )}
                </button>
              </form>

              {/* Quick Access Buttons */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-600 mb-4 text-center tracking-wide">
                  QUICK ACCESS
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(quickLogins).map(([type, config]) => {
                    const IconComponent = config.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleQuickLogin(type)}
                        className="quick-access-btn group relative overflow-hidden flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl text-slate-700 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                      >
                        <IconComponent
                          size={18}
                          className="relative z-10 transition-colors"
                        />
                        <span className="font-semibold text-sm relative z-10 transition-colors">
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-blue-200 font-medium">
              MedCure © 2024 • Secure Medical Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// PropTypes validation
Login.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};
