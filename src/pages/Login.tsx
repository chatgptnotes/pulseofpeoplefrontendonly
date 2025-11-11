import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

type AuthMode = 'login' | 'forgot-password' | 'magic-link';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showTestCreds, setShowTestCreds] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      console.log('Login form submitted for:', credentials.email);

      const success = await login(credentials.email, credentials.password);

      if (success) {
        console.log('Login successful, navigating to dashboard...');

        // Store persistence preference
        if (rememberMe) {
          localStorage.setItem('auth_remember', 'true');
        }

        navigate('/dashboard/legacy');
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!credentials.email) {
      setError('Please enter your email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(credentials.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess('Password reset link sent! Check your email inbox.');
      setTimeout(() => setMode('login'), 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!credentials.email) {
      setError('Please enter your email address');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: credentials.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/legacy`,
        },
      });

      if (error) throw error;

      setSuccess('Magic link sent! Check your email to sign in.');
    } catch (err: any) {
      console.error('Magic link error:', err);
      setError(err.message || 'Failed to send magic link');
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const renderLoginForm = () => (
    <>
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={credentials.email}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            placeholder="Enter your email"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={credentials.password}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-0"
          />
          <span className="ml-2 text-sm text-white">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => setMode('forgot-password')}
          className="text-sm text-blue-200 hover:text-white transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
            Signing in...
          </div>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Magic Link Option */}
      <button
        type="button"
        onClick={() => setMode('magic-link')}
        className="w-full text-center text-sm text-blue-200 hover:text-white transition-colors"
      >
        Or sign in with a magic link →
      </button>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
        <p className="text-sm text-blue-200">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={credentials.email}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            placeholder="Enter your email"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50"
      >
        Send Reset Link
      </button>

      <button
        type="button"
        onClick={() => setMode('login')}
        className="w-full text-center text-sm text-blue-200 hover:text-white transition-colors"
      >
        ← Back to sign in
      </button>
    </>
  );

  const renderMagicLinkForm = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Magic Link Sign In</h2>
        <p className="text-sm text-blue-200">
          No password needed. We'll email you a link to sign in.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={credentials.email}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            placeholder="Enter your email"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50"
      >
        Send Magic Link
      </button>

      <button
        type="button"
        onClick={() => setMode('login')}
        className="w-full text-center text-sm text-blue-200 hover:text-white transition-colors"
      >
        ← Back to password sign in
      </button>
    </>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    switch (mode) {
      case 'login':
        return handleLogin(e);
      case 'forgot-password':
        return handleForgotPassword(e);
      case 'magic-link':
        return handleMagicLink(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          {mode === 'login' && (
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Logo size="medium" variant="stacked" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-blue-200">
                Access your Pulse of People dashboard
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-200 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-200 flex-shrink-0 mt-0.5" />
                <p className="text-green-200 text-sm">{success}</p>
              </div>
            )}

            {/* Dynamic Form Content */}
            {mode === 'login' && renderLoginForm()}
            {mode === 'forgot-password' && renderForgotPasswordForm()}
            {mode === 'magic-link' && renderMagicLinkForm()}

            {/* Test Credentials (only in login mode) */}
            {mode === 'login' && (
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/40 rounded-xl p-3 shadow-lg">
                <button
                  type="button"
                  onClick={() => setShowTestCreds(!showTestCreds)}
                  className="w-full flex items-center justify-between"
                >
                  <p className="text-blue-100 text-sm font-bold flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                    Developer Test Credentials
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-200 bg-blue-500/30 px-2 py-0.5 rounded-full">
                      {showTestCreds ? 'Hide' : 'Show'}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-blue-200 transition-transform ${showTestCreds ? 'rotate-90' : ''}`}
                    />
                  </div>
                </button>

                {showTestCreds && (
                  <>
                    {/* Scrollable Credentials Grid */}
                    <div className="mt-3 max-h-64 overflow-y-auto pr-1">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Superadmin */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/10">
                          <span className="text-blue-200 text-xs font-medium">SUPERADMIN</span>
                          <div className="space-y-1 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">testadmin@tvk.com</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">Admin@2024</span>
                            </div>
                          </div>
                        </div>

                        {/* Admin */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/10">
                          <span className="text-blue-200 text-xs font-medium">ADMIN</span>
                          <div className="space-y-1 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">admin1@tvk.com</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">Admin@2024</span>
                            </div>
                          </div>
                        </div>

                        {/* Manager */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/10">
                          <span className="text-blue-200 text-xs font-medium">MANAGER</span>
                          <div className="space-y-1 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">manager@tvk.com</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">Manager@2024</span>
                            </div>
                          </div>
                        </div>

                        {/* Analyst */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/10">
                          <span className="text-blue-200 text-xs font-medium">ANALYST</span>
                          <div className="space-y-1 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">analyst@tvk.com</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">Analyst@2024</span>
                            </div>
                          </div>
                        </div>

                        {/* User */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/10">
                          <span className="text-blue-200 text-xs font-medium">USER</span>
                          <div className="space-y-1 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">user@tvk.com</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">User@2024</span>
                            </div>
                          </div>
                        </div>

                        {/* Volunteer */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/10">
                          <span className="text-blue-200 text-xs font-medium">VOLUNTEER</span>
                          <div className="space-y-1 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">volunteer1@tvk.com</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">Volunteer@2024</span>
                            </div>
                          </div>
                        </div>

                        {/* Viewer */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/10">
                          <span className="text-blue-200 text-xs font-medium">VIEWER</span>
                          <div className="space-y-1 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">viewer@tvk.com</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-blue-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">Viewer@2024</span>
                            </div>
                          </div>
                        </div>

                        {/* VIP Demo Account */}
                        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-amber-400/40 col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-amber-200 text-xs font-bold">VIP DEMO ACCOUNT</span>
                            <span className="text-[9px] text-amber-200 bg-amber-500/30 px-1.5 py-0.5 rounded">Presentation</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-amber-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">vijay@tvk.com</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-amber-300 flex-shrink-0" />
                              <span className="text-white font-mono text-[10px]">Vijay@2026</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-blue-200/70 text-xs mt-3 text-center italic">
                      Total: 507 users synced
                    </p>
                  </>
                )}
              </div>
            )}
          </form>

          {/* Back to Home (only in login mode) */}
          {mode === 'login' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center text-blue-200 hover:text-white text-sm transition-colors mx-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full animate-bounce"></div>
      <div className="absolute top-1/2 right-20 w-16 h-16 bg-indigo-500/10 rounded-full animate-ping"></div>
    </div>
  );
}
