import React, { useState, useEffect } from 'react';
import { apiFetch, setToken, setStoredUser, getApiBaseUrl, saveApiBaseUrl } from '../lib/api';
import { Mail, Lock, User, ArrowRight, Server, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { ToastType } from '../components/Toast';
import { useAppBrand } from '../context/BrandContext';

interface AuthProps {
  onSuccess: () => void;
  showToast: (msg: string, type: ToastType) => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, showToast }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  // Server API URL Config state
  const [currentApiUrl, setCurrentApiUrl] = useState<string>(getApiBaseUrl());
  const [inputApiUrl, setInputApiUrl] = useState<string>(getApiBaseUrl());
  const [showServerModal, setShowServerModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  const { branding } = useAppBrand();

  const testServerHealth = async (urlToTest?: string) => {
    setTestingConnection(true);
    setServerStatus('checking');
    const targetUrl = (urlToTest || currentApiUrl).replace(/\/+$/, '');
    try {
      const res = await fetch(`${targetUrl}/api/health`, {
        method: 'GET',
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    testServerHealth();
  }, [currentApiUrl]);

  const handleSaveApiUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveApiBaseUrl(inputApiUrl);
    setCurrentApiUrl(saved);
    showToast(`POCO Server URL updated to ${saved}`, 'info');
    setShowServerModal(false);
    testServerHealth(saved);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const data = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            fullName,
            companyName,
          }),
        });

        if (data.token) {
          setToken(data.token);
          setStoredUser(data.user);
        }

        showToast('Registration successful! Account created on POCO server.', 'success');
        onSuccess();
      } else {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (data.token) {
          setToken(data.token);
          setStoredUser(data.user);
        }

        showToast('Signed in successfully to POCO phone server!', 'success');
        onSuccess();
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication failed. Is your POCO server online?', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-xl shadow-indigo-600/20">
            <img
              src={branding.appLogo}
              alt={branding.appName}
              className="w-14 h-14 rounded-xl object-cover border border-indigo-400/50 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/app-icon.jpg';
              }}
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{branding.appName}</h1>
          <p className="text-sm text-indigo-400 font-medium mt-1">{branding.appSubtitle}</p>

          {/* Server Connection Badge */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setShowServerModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F111A] border border-white/10 hover:border-indigo-500/50 text-xs font-medium transition-all shadow-md group"
            >
              <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : serverStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
              <Server className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
              <span className="text-zinc-300 max-w-[220px] truncate">{currentApiUrl}</span>
              <Settings className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Auth Box */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Muhammed Salih"
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Company / Agency Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="SalihPort Digital"
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@salihport.local"
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account yet? Create one"}
            </button>
          </div>
        </div>
      </div>

      {/* POCO Server URL Config Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0D0E16] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Connect POCO Phone Server</h3>
              </div>
              <button
                onClick={() => setShowServerModal(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your POCO Android phone's public HTTPS tunnel URL (e.g. Cloudflare Tunnel or Pinggy).
            </p>

            <form onSubmit={handleSaveApiUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Server API Base URL</label>
                <input
                  type="url"
                  required
                  value={inputApiUrl}
                  onChange={(e) => setInputApiUrl(e.target.value)}
                  placeholder="https://salihport-demo.trycloudflare.com"
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Connection status:</span>
                <span className={`flex items-center gap-1.5 font-semibold ${serverStatus === 'online' ? 'text-emerald-400' : serverStatus === 'offline' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {testingConnection ? (
                    'Testing Connection...'
                  ) : serverStatus === 'online' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Server Online
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" /> Server Offline
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => testServerHealth(inputApiUrl)}
                  disabled={testingConnection}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                >
                  Test Connection
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
