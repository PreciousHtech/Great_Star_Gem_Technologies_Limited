import { useState, useMemo, useEffect, FormEvent } from 'react';
import { 
  ShieldCheck, Key, Lock, CheckCircle2, Copy, RefreshCw, 
  AlertTriangle, Eye, EyeOff, Save, Globe, Check, X,
  Loader2, AlertCircle, LifeBuoy
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { checkPasswordStrength } from '../../utils/passwordValidator';

export default function SecuritySettingsTab() {
  const { adminSettings, updateAdminSettings, changeAdminPassword, changeAdminUsername, verifyCurrentPassword } = useData();

  // Credentials State
  const [username, setUsername] = useState(adminSettings.username || 'admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingCredentials, setIsSubmittingCredentials] = useState(false);

  // Verification state for Current Password match before proceeding
  const [currentPasswordStatus, setCurrentPasswordStatus] = useState<'idle' | 'checking' | 'verified' | 'invalid'>('idle');
  const [currentPasswordFeedback, setCurrentPasswordFeedback] = useState<string>('');

  // Tokens & API State
  const [apiToken, setApiToken] = useState(adminSettings.apiToken);
  const [webhookSecret, setWebhookSecret] = useState(adminSettings.webhookSecret);
  const [copiedToken, setCopiedToken] = useState(false);

  // Access Control State
  const [sessionTimeout, setSessionTimeout] = useState(adminSettings.sessionTimeoutMinutes || 30);
  const [publicApiEnabled, setPublicApiEnabled] = useState(adminSettings.publicApiEnabled);

  // Master Recovery Key status
  const [recoveryStatus, setRecoveryStatus] = useState<{
    enabled: boolean;
    hasCustomKey: boolean;
    defaultKeyHint?: string;
  } | null>(null);

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/recovery-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled) {
          setRecoveryStatus(data);
        }
      })
      .catch(() => {});
  }, []);

  // Real-time password validation calculations
  const passwordStrength = useMemo(() => {
    return checkPasswordStrength(newPassword, username);
  }, [newPassword, username]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  // Check and verify current password against the active password in the database
  const handleVerifyCurrentPassword = async (passToVerify?: string): Promise<boolean> => {
    const candidate = passToVerify !== undefined ? passToVerify : currentPassword;
    if (!candidate) {
      setCurrentPasswordStatus('idle');
      setCurrentPasswordFeedback('');
      return false;
    }

    setCurrentPasswordStatus('checking');
    setCurrentPasswordFeedback('');

    try {
      const res = await verifyCurrentPassword(candidate);
      if (res.valid) {
        setCurrentPasswordStatus('verified');
        setCurrentPasswordFeedback('Current password verified and matched successfully.');
        return true;
      } else {
        setCurrentPasswordStatus('invalid');
        setCurrentPasswordFeedback(res.message || 'Current password does not match your active password.');
        return false;
      }
    } catch {
      setCurrentPasswordStatus('invalid');
      setCurrentPasswordFeedback('Failed to reach authentication server.');
      return false;
    }
  };

  const handleUpdateCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmittingCredentials(true);

    try {
      const isPasswordAttempt = Boolean(newPassword || confirmPassword);
      const isUsernameAttempt = username.trim() !== (adminSettings.username || 'admin');

      if (!isPasswordAttempt && !isUsernameAttempt) {
        setFeedback({
          type: 'error',
          message: 'No changes detected. Update your username or enter a new password to proceed.',
        });
        setIsSubmittingCredentials(false);
        return;
      }

      // 1. Current password is required whenever credentials (password or username) are changed
      if (!currentPassword) {
        setCurrentPasswordStatus('invalid');
        setCurrentPasswordFeedback('Current password is required to verify administrative authorization.');
        setFeedback({ type: 'error', message: 'Current password is required to verify administrator authorization.' });
        setIsSubmittingCredentials(false);
        return;
      }

      // 2. MUST verify that current input password matches the active password before proceeding
      const isCurrentMatch = await handleVerifyCurrentPassword(currentPassword);
      if (!isCurrentMatch) {
        setFeedback({
          type: 'error',
          message: 'Current password verification failed. The entered current password does not match your active administrator password.',
        });
        setIsSubmittingCredentials(false);
        return;
      }

      // Handle password change if requested
      if (isPasswordAttempt) {
        // 3. New password and confirmation must be provided
        if (!newPassword || !confirmPassword) {
          setFeedback({ type: 'error', message: 'Please enter both the new password and confirmation password.' });
          setIsSubmittingCredentials(false);
          return;
        }

        // 4. New password cannot be identical to current password
        if (currentPassword === newPassword) {
          setFeedback({ type: 'error', message: 'New password cannot be identical to your current password. Please choose a different password.' });
          setIsSubmittingCredentials(false);
          return;
        }

        // 5. New and confirm must match
        if (newPassword !== confirmPassword) {
          setFeedback({ type: 'error', message: 'New password and confirm password do not match.' });
          setIsSubmittingCredentials(false);
          return;
        }

        // 6. Security policy check
        if (!passwordStrength.isValid) {
          setFeedback({ 
            type: 'error', 
            message: passwordStrength.errorMessage || 'New password does not fulfill security requirements.' 
          });
          setIsSubmittingCredentials(false);
          return;
        }

        // 7. Proceed with cryptographically salted hash update in PostgreSQL
        const result = await changeAdminPassword(currentPassword, newPassword, confirmPassword);
        if (!result.success) {
          setFeedback({ type: 'error', message: result.message });
          setIsSubmittingCredentials(false);
          return;
        }
      }

      // Handle username change if requested
      if (isUsernameAttempt) {
        // When password was also changed in this request, the active password is now `newPassword`
        const passForUsernameChange = isPasswordAttempt ? newPassword : currentPassword;
        const userResult = await changeAdminUsername(username, passForUsernameChange);
        if (!userResult.success) {
          setFeedback({ type: 'error', message: userResult.message });
          setIsSubmittingCredentials(false);
          return;
        }
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordStatus('idle');
      setCurrentPasswordFeedback('');
      setFeedback({ 
        type: 'success', 
        message: 'Administrator security credentials successfully verified and updated in database.' 
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: unknown) {
      setFeedback({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to update credentials' 
      });
    } finally {
      setIsSubmittingCredentials(false);
    }
  };

  const handleRegenerateToken = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const newToken = `gsg_live_sec_${randomSuffix}`;
    setApiToken(newToken);
    updateAdminSettings({ apiToken: newToken });
    setFeedback({ type: 'success', message: 'Generated and rotated new Production API Token.' });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSaveSecuritySettings = (e: FormEvent) => {
    e.preventDefault();
    updateAdminSettings({
      apiToken,
      webhookSecret,
      sessionTimeoutMinutes: Number(sessionTimeout),
      publicApiEnabled
    });
    setFeedback({ type: 'success', message: 'Session timeout policy saved and active.' });
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid: 2 Columns for Credentials & Access Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Admin Account Credentials */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-900">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                  Admin Account Credentials
                </h3>
                <p className="text-xs text-slate-400">
                  Update your primary administrative username and password. For security, changing your username or password requires confirming your active current password, and updates are committed directly to the secure database.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-4" id="admin-credentials-form">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Current Password <span className="text-slate-500 font-normal lowercase">(must match current password)</span>
                  </label>
                  {currentPassword && (
                    <div className="flex items-center gap-2">
                      {currentPasswordStatus === 'checking' && (
                        <span className="flex items-center gap-1 text-[10px] text-purple-400 font-mono">
                          <Loader2 className="w-3 h-3 animate-spin" /> Verifying match...
                        </span>
                      )}
                      {currentPasswordStatus === 'verified' && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Current Password Matched
                        </span>
                      )}
                      {currentPasswordStatus === 'invalid' && (
                        <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30 font-mono">
                          <AlertCircle className="w-3 h-3 text-red-400" /> Password Mismatch
                        </span>
                      )}
                      {currentPasswordStatus === 'idle' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyCurrentPassword()}
                          className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
                        >
                          Verify Match
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (currentPasswordStatus !== 'idle') {
                        setCurrentPasswordStatus('idle');
                        setCurrentPasswordFeedback('');
                      }
                    }}
                    onBlur={() => {
                      if (currentPassword && currentPasswordStatus === 'idle') {
                        handleVerifyCurrentPassword();
                      }
                    }}
                    placeholder="Enter existing active password"
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border text-slate-100 text-xs focus:outline-none transition-colors ${
                      currentPasswordStatus === 'verified'
                        ? 'border-emerald-500/50 focus:border-emerald-500'
                        : currentPasswordStatus === 'invalid'
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-slate-800 focus:border-purple-500'
                    }`}
                    id="current-admin-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    title={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {currentPasswordFeedback && (
                  <p className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${
                    currentPasswordStatus === 'verified' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {currentPasswordStatus === 'verified' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{currentPasswordFeedback}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      New Password
                    </label>
                    {newPassword && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        passwordStrength.score >= 4 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                          : passwordStrength.score === 3 
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : passwordStrength.score === 2
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-red-500/10 text-red-300 border-red-500/30'
                      }`}>
                        {passwordStrength.strengthLabel}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters & symbols"
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border text-slate-100 text-xs focus:outline-none transition-colors ${
                        newPassword && !passwordStrength.isValid 
                          ? 'border-amber-500/50 focus:border-amber-500' 
                          : newPassword && passwordStrength.isValid
                          ? 'border-emerald-500/50 focus:border-emerald-500'
                          : 'border-slate-800 focus:border-purple-500'
                      }`}
                      id="new-admin-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      title={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    {passwordsMatch !== null && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        passwordsMatch 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                          : 'bg-red-500/10 text-red-300 border-red-500/30'
                      }`}>
                        {passwordsMatch ? 'Match' : 'Mismatch'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border text-slate-100 text-xs focus:outline-none transition-colors ${
                        passwordsMatch === false
                          ? 'border-red-500/50 focus:border-red-500'
                          : passwordsMatch === true
                          ? 'border-emerald-500/50 focus:border-emerald-500'
                          : 'border-slate-800 focus:border-purple-500'
                      }`}
                      id="confirm-admin-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter & Live Checklist */}
              {newPassword && (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                  {/* Strength Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5 text-slate-400">
                      <span className="font-mono">Security Strength</span>
                      <span className="font-semibold text-slate-200">{passwordStrength.strengthLabel}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 1 
                          ? passwordStrength.score >= 4 ? 'bg-emerald-400' : passwordStrength.score === 3 ? 'bg-purple-400' : passwordStrength.score === 2 ? 'bg-amber-400' : 'bg-red-400'
                          : 'bg-transparent'
                      }`} />
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 2 
                          ? passwordStrength.score >= 4 ? 'bg-emerald-400' : passwordStrength.score === 3 ? 'bg-purple-400' : 'bg-amber-400'
                          : 'bg-transparent'
                      }`} />
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 3 
                          ? passwordStrength.score >= 4 ? 'bg-emerald-400' : 'bg-purple-400'
                          : 'bg-transparent'
                      }`} />
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 4 ? 'bg-emerald-400' : 'bg-transparent'
                      }`} />
                    </div>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300 font-mono">
                    <div className="flex items-center gap-1.5">
                      {passwordStrength.requirements.minLength ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className={passwordStrength.requirements.minLength ? 'text-slate-200' : 'text-slate-500'}>
                        At least 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {passwordStrength.requirements.hasUpper && passwordStrength.requirements.hasLower ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className={passwordStrength.requirements.hasUpper && passwordStrength.requirements.hasLower ? 'text-slate-200' : 'text-slate-500'}>
                        Upper & lower case
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {passwordStrength.requirements.hasNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className={passwordStrength.requirements.hasNumber ? 'text-slate-200' : 'text-slate-500'}>
                        Number (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {passwordStrength.requirements.hasSpecial ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className={passwordStrength.requirements.hasSpecial ? 'text-slate-200' : 'text-slate-500'}>
                        Special symbol (!@#$...)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                      {passwordStrength.requirements.notCommon && passwordStrength.requirements.notContainsUsername ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className={passwordStrength.requirements.notCommon && passwordStrength.requirements.notContainsUsername ? 'text-slate-200' : 'text-slate-500'}>
                        Unique & not containing username
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCredentials}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  id="update-credentials-btn"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmittingCredentials ? 'Validating & Updating...' : 'Update & Verify Credentials'}</span>
                </button>
              </div>
            </form>

            {/* Master Recovery Key Info Box */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Emergency Master Recovery Key
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  recoveryStatus?.hasCustomKey
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {recoveryStatus?.hasCustomKey ? 'Custom Secret Set' : 'Default Key Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                If you ever forget your password, click &quot;Reset with Recovery Key&quot; on the login page to bypass lockout and configure new credentials.
              </p>
              <div className="text-[11px] text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/80 font-mono flex items-center justify-between">
                <span className="text-slate-400">Environment Variable:</span>
                <span className="text-amber-300 font-semibold">ADMIN_RECOVERY_KEY</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Password Storage: Salted PBKDF2-SHA512 (Zero Plain Text)</span>
            <span>Database: PostgreSQL Synced</span>
          </div>
        </div>

        {/* Section 2: Access Control Settings */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-900">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                  Session Timeout Policy
                </h3>
                <p className="text-xs text-slate-400">
                  Configure active inactivity threshold to safeguard administrative sessions.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSecuritySettings} className="space-y-4" id="access-control-form">
              {/* Session Inactivity Timeout */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Inactivity Timeout Limit
                </label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value={15}>15 Minutes of Inactivity</option>
                  <option value={30}>30 Minutes of Inactivity (Recommended)</option>
                  <option value={60}>1 Hour Session Duration</option>
                  <option value={480}>8 Hours (Full Shift)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  When enabled, the browser tracks user interaction (clicks, keystrokes, mouse moves, scrolls). If inactive for this duration, the admin session will automatically terminate for security.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  id="save-access-control-btn"
                >
                  <Save className="w-3.5 h-3.5 text-purple-400" />
                  <span>Save Session Timeout</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Session Inactivity Guard: Active</span>
            <span className="text-emerald-400 font-mono">ENFORCING ({sessionTimeout} MIN)</span>
          </div>
        </div>
      </div>

      {/* Section 3: API Tokens & Integration */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                Developer API Tokens & Endpoints
              </h3>
              <p className="text-xs text-slate-400">
                Secret bearer keys for automated project publishing, CMS hooks, and headless content querying.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRegenerateToken}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start cursor-pointer"
            id="regenerate-api-token-btn"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Regenerate Token</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Production Token */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Production Bearer API Key
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={apiToken}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-purple-300 font-mono text-xs focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyToken}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedToken ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Webhook Signing Secret
              </label>
              <input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Headless Content API Routing
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span>/api/v1/content/projects</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
