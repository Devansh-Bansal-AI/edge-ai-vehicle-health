'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@edgeai.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid credentials');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fce9ed] relative overflow-hidden" id="login-page">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(190,18,60,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(190,18,60,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/[0.03] rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 mb-4 shadow-[0_10px_30px_-8px_rgba(225,29,72,0.5)]">
            <Zap className="w-7 h-7 text-white" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">EdgeAI Platform</h1>
          <p className="text-sm text-gray-400 mt-1">Vehicle Health & Predictive Maintenance</p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-rose-100 rounded-2xl p-6 backdrop-blur-sm shadow-2xl"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-600" />
            Sign In
          </h2>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-rose-50/60 border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-900
                             placeholder:text-gray-300 focus:border-rose-500/30 focus:outline-none focus:ring-1 focus:ring-rose-500/20
                             transition-all"
                  placeholder="admin@edgeai.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-rose-50/60 border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-sm text-gray-900
                             placeholder:text-gray-300 focus:border-rose-500/30 focus:outline-none focus:ring-1 focus:ring-rose-500/20
                             transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg text-sm font-semibold text-white
                       hover:from-rose-400 hover:to-rose-500 active:scale-[0.98] transition-all
                       disabled:opacity-50 shadow-[0_10px_24px_-8px_rgba(225,29,72,0.5)]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="mt-4 text-center text-[10px] text-gray-300">
            Demo: admin@edgeai.com / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
