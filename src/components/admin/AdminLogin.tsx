import { useState, useEffect, FormEvent } from 'react';
import { 
  ShieldCheck, Lock, User, AlertCircle, ArrowLeft, KeyRound, CheckCircle2, 
  Eye, EyeOff, Smartphone, Key, RefreshCw, ShieldAlert 
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const { adminLogin, verify2FALogin, navigateTo, adminSettings } = useData();
  const [username, setUsername] = useState(adminSettings.username || 'admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 2FA Verification State
  const [step, setStep] = useState<'credentials' | 'two-factor'>('credentials');
  const [tempToken, setTempToken] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');
  const [isBackupCodeMode, setIsBackupCodeMode] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/admin/auth-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.username) {
          setUsername(data.username);
        }
      })
      .catch(() => {});
  }, []);

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await adminLogin(username, password);
      setIsLoading(false);
      if (res.success) {
        if (res.require2FA && res.tempToken) {
          setTempToken(res.tempToken);
          setStep('two-factor');
          setTwoFactorCode('');
          setIsBackupCodeMode(false);
        } else {
          onSuccess();
        }
      } else {
        setError(res.message || 'Invalid administrator credentials. Please check your username and password.');
      }
    } catch {
      setIsLoading(false);
      setError('An error occurred while connecting to the authentication service.');
    }
  };

  const handleTwoFactorSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanCode = twoFactorCode.trim();
    if (!cleanCode) {
      setIsLoading(false);
      setError(isBackupCodeMode ? 'Please enter your emergency backup code.' : 'Please enter the 6-digit authenticator code.');
      return;
    }

    try {
      const res = await verify2FALogin(tempToken, cleanCode, isBackupCodeMode);
      setIsLoading(false);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Verification failed. Please check the code and try again.');
      }
    } catch {
      setIsLoading(false);
      setError('An error occurred while verifying your two-factor authentication code.');
    }
  };

  const handleCancel2FA = () => {
    setStep('credentials');
    setTempToken('');
    setTwoFactorCode('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Return to Public Website */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center z-10">
        <button
          type="button"
          onClick={() => navigateTo('public')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-purple-300 transition-colors cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800"
          id="admin-return-home-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Public Website</span>
        </button>

        <span className="text-[11px] font-mono text-purple-400/80 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20">
          SECURE PORTAL
        </span>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-slate-950/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl">
        {step === 'credentials' ? (
          <>
            {/* Header Icon */}
            <div className="text-center space-y-3 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
                <Lock className="w-8 h-8 text-white" />
              </div>

              <div>
                <div className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
                  ADMIN CONSOLE
                </div>
                <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
                  Restricted Access
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Authenticate with administrative credentials to manage dynamic developer portfolio projects, client testimonials, and system security.
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-300 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-5" id="admin-login-form">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    id="admin-username-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Secret Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    id="admin-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                id="admin-login-submit-btn"
              >
                {isLoading ? (
                  <span>Authenticating Secure Token...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enter Admin Console</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Step 2: Two-Factor Authentication TOTP Verification Screen */
          <div className="space-y-6" id="admin-2fa-verification-view">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 animate-pulse">
                {isBackupCodeMode ? (
                  <Key className="w-8 h-8 text-white" />
                ) : (
                  <Smartphone className="w-8 h-8 text-white" />
                )}
              </div>

              <div>
                <div className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  TWO-FACTOR AUTHENTICATION
                </div>
                <h2 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
                  {isBackupCodeMode ? 'Recovery Backup Code' : 'Authenticator Code'}
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {isBackupCodeMode
                    ? 'Enter one of your 8-character single-use emergency backup codes to access your account.'
                    : 'Open Google Authenticator, Authy, or 1Password to view your current 6-digit TOTP verification code.'}
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-300 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleTwoFactorSubmit} className="space-y-5" id="admin-2fa-form">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 text-center">
                  {isBackupCodeMode ? 'Enter Emergency Backup Code' : 'Enter 6-Digit Code'}
                </label>

                {isBackupCodeMode ? (
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX"
                      maxLength={12}
                      className="w-full py-3.5 px-4 text-center font-mono text-xl tracking-[0.2em] rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors uppercase"
                      id="admin-2fa-backup-input"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoFocus
                      required
                      value={twoFactorCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        setTwoFactorCode(val);
                      }}
                      placeholder="••••••"
                      maxLength={6}
                      className="w-full py-3.5 px-4 text-center font-mono text-2xl tracking-[0.4em] rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 focus:outline-none focus:border-emerald-500 transition-colors"
                      id="admin-2fa-totp-input"
                    />
                  </div>
                )}
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  {isBackupCodeMode
                    ? 'Each recovery code can only be used once.'
                    : 'Codes refresh automatically every 30 seconds.'}
                </p>
              </div>

              {/* Toggle Backup Code Mode */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsBackupCodeMode(!isBackupCodeMode);
                    setTwoFactorCode('');
                    setError(null);
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 underline font-medium cursor-pointer"
                  id="admin-toggle-backup-code-mode-btn"
                >
                  {isBackupCodeMode
                    ? '← Use 6-digit authenticator code instead'
                    : "Don't have your phone? Use an emergency recovery code"}
                </button>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading || (isBackupCodeMode ? twoFactorCode.length < 4 : twoFactorCode.length !== 6)}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  id="admin-2fa-verify-btn"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Verifying Code...' : 'Verify & Continue'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancel2FA}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
                  id="admin-2fa-cancel-btn"
                >
                  ← Back to Password Login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Security Badges */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            256-Bit SSL Auth
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-purple-400" />
            TOTP MFA Enabled
          </span>
        </div>
      </div>
    </div>
  );
}
