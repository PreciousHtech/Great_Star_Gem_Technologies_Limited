import { useState, useEffect, FormEvent } from 'react';
import { 
  ShieldCheck, Lock, User, AlertCircle, ArrowLeft, KeyRound, CheckCircle2, 
  Eye, EyeOff, Key, RefreshCw, LifeBuoy, Check, X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { checkPasswordStrength } from '../../utils/passwordValidator';

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const { adminLogin, recoverAdminPassword, navigateTo, adminSettings } = useData();
  const [username, setUsername] = useState(adminSettings.username || 'admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Authentication Flow Step: 'credentials' | 'recovery'
  const [step, setStep] = useState<'credentials' | 'recovery'>('credentials');

  // Recovery State
  const [recoveryKey, setRecoveryKey] = useState('');
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [recoveryStatusInfo, setRecoveryStatusInfo] = useState<{
    enabled: boolean;
    hasCustomKey: boolean;
    defaultKeyHint?: string;
  } | null>(null);

  const passwordStrength = checkPasswordStrength(newPassword, username);

  useEffect(() => {
    fetch('/api/admin/auth-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.username) {
          setUsername(data.username);
        }
      })
      .catch(() => {});

    fetch('/api/admin/recovery-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled) {
          setRecoveryStatusInfo(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecoverySuccess(null);
    setIsLoading(true);

    try {
      const res = await adminLogin(username, password);
      setIsLoading(false);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Invalid administrator credentials. Please check your username and password.');
      }
    } catch {
      setIsLoading(false);
      setError('An error occurred while connecting to the authentication service.');
    }
  };

  const handleRecoverySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecoverySuccess(null);
    setIsLoading(true);

    try {
      const res = await recoverAdminPassword(
        recoveryKey,
        newPassword,
        confirmPassword
      );
      setIsLoading(false);
      if (res.success) {
        setRecoverySuccess(res.message);
        setStep('credentials');
        setPassword('');
        setRecoveryKey('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.message || 'Failed to recover administrative credentials.');
      }
    } catch {
      setIsLoading(false);
      setError('An error occurred while communicating with the recovery service.');
    }
  };

  const handleCancelRecovery = () => {
    setStep('credentials');
    setRecoveryKey('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

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

        <span className="text-[11px] font-mono text-teal-400/80 bg-teal-500/10 px-2.5 py-1 rounded border border-teal-500/20">
          SECURE PORTAL
        </span>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-slate-950/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl">
        {step === 'credentials' ? (
          <>
            {/* Header Icon */}
            <div className="text-center space-y-3 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-teal-600/30">
                <Lock className="w-8 h-8 text-white" />
              </div>

              <div>
                <div className="text-xs font-mono font-bold tracking-widest text-teal-400 uppercase">
                  ADMIN PORTAL
                </div>
                <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
                  Restricted Access
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Authenticate with administrative credentials to manage dynamic developer portfolio projects, client testimonials, and system security.
                </p>
              </div>
            </div>

            {/* Success Alert after recovery */}
            {recoverySuccess && (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-300 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{recoverySuccess}</span>
              </div>
            )}

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
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors"
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
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors"
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

                {/* Forgot Password Recovery Trigger */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500">Forgot credentials?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('recovery');
                      setError(null);
                      setRecoverySuccess(null);
                    }}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium cursor-pointer hover:underline"
                    id="admin-forgot-password-link"
                  >
                    Reset with Recovery Key
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-lg shadow-teal-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                id="admin-login-submit-btn"
              >
                {isLoading ? (
                  <span>Authenticating Secure Token...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enter Admin Portal</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Step 2: Emergency Master Recovery Key Screen */
          <div className="space-y-6" id="admin-recovery-view">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-teal-600 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-600/20">
                <LifeBuoy className="w-8 h-8 text-white" />
              </div>

              <div>
                <div className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                  MASTER RECOVERY
                </div>
                <h2 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
                  Reset Credentials
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Enter your project&apos;s Master Recovery Key to reset your administrator password and regain access.
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

            <form onSubmit={handleRecoverySubmit} className="space-y-4" id="admin-recovery-form">
              {/* Field 1: Master Recovery Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Master Recovery Key
                  </label>
                  <span className="text-[10px] text-amber-400/90 font-mono">Server Secret</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showRecoveryKey ? 'text' : 'password'}
                    required
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value)}
                    placeholder="Enter Master Recovery Key"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors font-mono"
                    id="admin-recovery-key-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoveryKey(!showRecoveryKey)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showRecoveryKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                  Configured via <code className="text-amber-300 font-mono text-[10px]">ADMIN_RECOVERY_KEY</code> in your environment.
                  {recoveryStatusInfo?.defaultKeyHint && (
                    <span className="block text-slate-400 text-[10px] mt-0.5">
                      Default Key: <code className="text-teal-300 font-mono">{recoveryStatusInfo.defaultKeyHint}</code>
                    </span>
                  )}
                </p>
              </div>

              {/* Field 2: New Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Administrator Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create new password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                    id="admin-new-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Real-Time Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Password Strength:</span>
                      <span className={`font-semibold text-[11px] ${
                        passwordStrength.score >= 4 ? 'text-emerald-400' :
                        passwordStrength.score === 3 ? 'text-purple-400' :
                        passwordStrength.score === 2 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {passwordStrength.strengthLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      <div className={`h-full rounded-full transition-colors ${
                        passwordStrength.score >= 1 
                          ? passwordStrength.score >= 4 ? 'bg-emerald-400' : passwordStrength.score === 3 ? 'bg-purple-400' : passwordStrength.score === 2 ? 'bg-amber-400' : 'bg-red-400'
                          : 'bg-slate-800'
                      }`} />
                      <div className={`h-full rounded-full transition-colors ${
                        passwordStrength.score >= 2 
                          ? passwordStrength.score >= 4 ? 'bg-emerald-400' : passwordStrength.score === 3 ? 'bg-purple-400' : 'bg-amber-400'
                          : 'bg-slate-800'
                      }`} />
                      <div className={`h-full rounded-full transition-colors ${
                        passwordStrength.score >= 3 
                          ? passwordStrength.score >= 4 ? 'bg-emerald-400' : 'bg-purple-400'
                          : 'bg-slate-800'
                      }`} />
                      <div className={`h-full rounded-full transition-colors ${
                        passwordStrength.score >= 4 ? 'bg-emerald-400' : 'bg-slate-800'
                      }`} />
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                      <span className={passwordStrength.requirements.minLength ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                        {passwordStrength.requirements.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ Characters
                      </span>
                      <span className={passwordStrength.requirements.hasUpper && passwordStrength.requirements.hasLower ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                        {passwordStrength.requirements.hasUpper && passwordStrength.requirements.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Upper & Lower
                      </span>
                      <span className={passwordStrength.requirements.hasNumber ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                        {passwordStrength.requirements.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Number (0-9)
                      </span>
                      <span className={passwordStrength.requirements.hasSpecial ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                        {passwordStrength.requirements.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Special Symbol
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                    id="admin-confirm-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-red-400 mt-1">Passwords do not match.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !recoveryKey || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordStrength.isValid}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-lg shadow-teal-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  id="admin-recovery-submit-btn"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LifeBuoy className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Resetting Password...' : 'Reset & Restore Access'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelRecovery}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
                  id="admin-recovery-cancel-btn"
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
            <ShieldCheck className="w-3 h-3 text-teal-400" />
            Master Key Recovery
          </span>
        </div>
      </div>
    </div>
  );
}

