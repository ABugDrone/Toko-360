'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { mapDatabaseError } from '@/lib/error-handler';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate inputs
    if (!staffId.trim() || !password.trim()) {
      setError('Please enter both Staff ID and Password');
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await login(staffId, password);
      
      if (!result) {
        setError('Invalid credentials. Please check your Staff ID and Password.');
        setIsLoading(false);
        return;
      }
      
      // Show success message
      setSuccess('Login successful! Redirecting to dashboard...');
      
      // Add small delay to show success message before navigation
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle different error types
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid Staff ID or Password. Please try again.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        const dbError = mapDatabaseError(err);
        setError(dbError.message || 'Login failed. Please try again.');
      }
      
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            {/* Toko 360 Neon Logo */}
            <div className="relative">
              <style>{`
                @keyframes rotateNeon {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                .logo-spin {
                  animation: rotateNeon 8s linear infinite;
                }
              `}</style>
              <div className="w-20 h-20 relative">
                <svg viewBox="0 0 60 60" className="w-full h-full logo-spin" style={{textShadow: '0 0 10px rgba(34, 211, 238, 0.8), 0 0 20px rgba(34, 211, 238, 0.6)', filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.4))'}}>
                  <circle cx="30" cy="30" r="28" fill="none" stroke="url(#neonGradient)" strokeWidth="2" opacity="0.8"/>
                  <g>
                    {/* Colorful segments inspired by Toko logo */}
                    <circle cx="35" cy="20" r="6" fill="#FF6B6B"/>
                    <circle cx="42" cy="28" r="6" fill="#4ECDC4"/>
                    <circle cx="38" cy="38" r="6" fill="#95E1D3"/>
                    <circle cx="25" cy="40" r="6" fill="#FFE66D"/>
                  </g>
                  <defs>
                    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8"/>
                      <stop offset="50%" stopColor="#4ade80" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-2" style={{textShadow: '0 0 10px rgba(34, 211, 238, 0.8), 0 0 20px rgba(34, 211, 238, 0.6)'}}>
            TOKO <span style={{textShadow: '0 0 10px rgba(74, 222, 128, 0.8), 0 0 20px rgba(74, 222, 128, 0.6)'}}>360</span>
          </h1>
          <p className="text-cyan-400 text-sm tracking-widest font-bold">STAFF INTERNAL REPORTING SYSTEM</p>
        </div>

        {/* Login Form */}
        <div className="card backdrop-blur-xl border rounded-2xl p-8 shadow-2xl mb-4 transition-all duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
          <h2 className="text-2xl font-bold mb-2 transition-all duration-300" style={{ color: 'var(--theme-text)' }}>Welcome Back</h2>
          <p className="text-sm mb-8 transition-all duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Please enter your credentials to access the portal.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Staff ID Input */}
            <div>
              <label className="block text-sm font-bold mb-2 transition-all duration-300" style={{ color: 'var(--theme-accent)' }}>Staff ID</label>
              <div className="relative">
                <svg className="absolute left-4 top-3 transition-all duration-300" style={{ color: 'var(--theme-accent)', opacity: 0.5 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <Input
                  type="text"
                  placeholder="Enter your unique ID"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 pl-12 pr-4 py-3 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--theme-background)', 
                    borderColor: 'var(--theme-border)', 
                    color: 'var(--theme-text)',
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold mb-2 transition-all duration-300" style={{ color: 'var(--theme-accent)' }}>Password</label>
              <div className="relative">
                <svg className="absolute left-4 top-3 transition-all duration-300" style={{ color: 'var(--theme-accent)', opacity: 0.5 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 pl-12 pr-12 py-3 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--theme-background)', 
                    borderColor: 'var(--theme-border)', 
                    color: 'var(--theme-text)',
                  }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 transition-all duration-300 hover:opacity-100"
                  style={{ color: 'var(--theme-accent)', opacity: 0.5 }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right mt-2">
                <a href="#" className="text-sm font-semibold transition-all duration-300 hover:opacity-80" style={{ color: 'var(--theme-accent)' }}>Forgot password?</a>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="remember" 
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer transition-all duration-300" 
                style={{ accentColor: 'var(--theme-accent)' }}
              />
              <label htmlFor="remember" className="ml-2 text-sm cursor-pointer transition-all duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Stay signed in for 30 days</label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 border rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 border rounded-lg text-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#22c55e' }}>
                {success}
              </div>
            )}

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full font-black py-3 rounded-lg transition-all duration-300 transform hover:scale-105 text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                  SIGNING IN...
                </>
              ) : (
                'SIGN IN TO PORTAL →'
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center border-t pt-6 transition-all duration-300" style={{ borderColor: 'var(--theme-border)' }}>
            <p className="text-sm transition-all duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
              Need help? Contact <a href="#" className="font-semibold transition-all duration-300 hover:opacity-80" style={{ color: 'var(--theme-accent)' }}>IT Support</a>
            </p>
            <div className="flex justify-center gap-6 mt-4 text-xs transition-all duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
              <a href="#" className="transition-all duration-300 hover:opacity-100">PRIVACY POLICY</a>
              <a href="#" className="transition-all duration-300 hover:opacity-100">TERMS OF SERVICE</a>
              <a href="#" className="transition-all duration-300 hover:opacity-100">SYSTEM STATUS: ONLINE</a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3 text-sm transition-all duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
          <p>Need help? Contact <a href="#" className="font-semibold transition-all duration-300 hover:opacity-100" style={{ color: 'var(--theme-accent)' }}>IT Support</a></p>
          <div className="flex justify-center gap-4 pt-2 border-t transition-all duration-300" style={{ borderColor: 'var(--theme-border)' }}>
            <a href="#" className="transition-all duration-300 hover:opacity-100">PRIVACY POLICY</a>
            <a href="#" className="transition-all duration-300 hover:opacity-100">TERMS OF SERVICE</a>
            <a href="#" className="transition-all duration-300 hover:opacity-100">SYSTEM STATUS: ONLINE</a>
          </div>
        </div>
      </div>
    </div>
  );
}
