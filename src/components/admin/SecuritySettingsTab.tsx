import { useState, useMemo, useEffect, FormEvent } from 'react';
import { 
  ShieldCheck, Key, Lock, CheckCircle2, /* [UNUSED - Candidate for removal]: RefreshCw, */ 
  AlertTriangle, Eye, EyeOff, Save, Check, X,
  Loader2, AlertCircle, LifeBuoy, Database
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { checkPasswordStrength } from '../../utils/passwordValidator';

export default function SecuritySettingsTab() {
  const { adminSettings, updateAdminSettings, changeAdminPassword, changeAdminUsername, verifyCurrentPassword, updateRecoveryKey } = useData();

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

  // Access Control State
  const [sessionTimeout, setSessionTimeout] = useState(adminSettings.sessionTimeoutMinutes || 30);

  // Master Recovery Key status & management
  const [recoveryStatus, setRecoveryStatus] = useState<{
    enabled: boolean;
    hasCustomKey: boolean;
    source?: 'database' | 'environment' | 'default';
    defaultKeyHint?: string;
  } | null>(null);
  const [isEditingRecoveryKey, setIsEditingRecoveryKey] = useState(false);
  const [newCustomRecoveryKey, setNewCustomRecoveryKey] = useState('');
  const [recoveryCurrentPassword, setRecoveryCurrentPassword] = useState('');
  const [showRecoveryCurrentPassword, setShowRecoveryCurrentPassword] = useState(false);
  const [showNewCustomRecoveryKey, setShowNewCustomRecoveryKey] = useState(false);
  const [isUpdatingRecoveryKey, setIsUpdatingRecoveryKey] = useState(false);
  const [recoveryKeyFeedback, setRecoveryKeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleSaveSecuritySettings = (e: FormEvent) => {
    e.preventDefault();
    updateAdminSettings({
      sessionTimeoutMinutes: Number(sessionTimeout),
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
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-200'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
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
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Admin Username / Name</span>
                  <span className="text-[10px] text-teal-400 font-normal lowercase font-mono">
                    active: {adminSettings.username || 'admin'}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or your administrative handle"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  id="admin-username-input"
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  You can change your admin username/name at any time. Simply enter your current password below to authorize the change.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Current Password <span className="text-slate-500 font-normal lowercase">(required to authorize changes)</span>
                  </label>
                  {currentPassword && (
                    <div className="flex items-center gap-2">
                      {currentPasswordStatus === 'checking' && (
                        <span className="flex items-center gap-1 text-[10px] text-teal-400 font-mono">
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
                          className="text-[10px] text-teal-400 hover:text-teal-300 underline font-semibold cursor-pointer"
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
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border text-slate-100 text-sm sm:text-xs focus:outline-none transition-colors min-h-[42px] ${
                      currentPasswordStatus === 'verified'
                        ? 'border-emerald-500/50 focus:border-emerald-500'
                        : currentPasswordStatus === 'invalid'
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-slate-800 focus:border-teal-500'
                    }`}
                    id="current-admin-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer min-h-[42px]"
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
                      New Password <span className="text-slate-500 font-normal lowercase">(optional if only changing username)</span>
                    </label>
                    {newPassword && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        passwordStrength.score >= 4 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                          : passwordStrength.score === 3 
                          ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
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
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border text-slate-100 text-sm sm:text-xs focus:outline-none transition-colors min-h-[42px] ${
                        newPassword && !passwordStrength.isValid 
                          ? 'border-amber-500/50 focus:border-amber-500' 
                          : newPassword && passwordStrength.isValid
                          ? 'border-emerald-500/50 focus:border-emerald-500'
                          : 'border-slate-800 focus:border-teal-500'
                      }`}
                      id="new-admin-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer min-h-[42px]"
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
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border text-slate-100 text-sm sm:text-xs focus:outline-none transition-colors min-h-[42px] ${
                        passwordsMatch === false
                          ? 'border-red-500/50 focus:border-red-500'
                          : passwordsMatch === true
                          ? 'border-emerald-500/50 focus:border-emerald-500'
                          : 'border-slate-800 focus:border-teal-500'
                      }`}
                      id="confirm-admin-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer min-h-[42px]"
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
                          ? passwordStrength.score >= 4 ? 'bg-emerald-400' : passwordStrength.score === 3 ? 'bg-teal-400' : passwordStrength.score === 2 ? 'bg-amber-400' : 'bg-red-400'
                          : 'bg-transparent'
                      }`} />
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 2 
                          ? passwordStrength.score >= 4 ? 'bg-emerald-400' : passwordStrength.score === 3 ? 'bg-teal-400' : 'bg-amber-400'
                          : 'bg-transparent'
                      }`} />
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 3 
                          ? passwordStrength.score >= 4 ? 'bg-emerald-400' : 'bg-teal-400'
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
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  id="update-credentials-btn"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {isSubmittingCredentials 
                      ? 'Validating & Updating...' 
                      : username.trim() !== (adminSettings.username || 'admin') && !newPassword && !confirmPassword
                      ? 'Save Updated Admin Username'
                      : username.trim() !== (adminSettings.username || 'admin') && Boolean(newPassword || confirmPassword)
                      ? 'Update Admin Username & Password'
                      : 'Update Administrator Password'}
                  </span>
                </button>
              </div>
            </form>

            {/* Master Recovery Key Info & Supabase Management Box */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4" id="supabase-recovery-key-card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Master Recovery Key
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                    recoveryStatus?.source === 'database'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : recoveryStatus?.source === 'environment'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {recoveryStatus?.source === 'database'
                      ? 'Supabase Table Synced'
                      : recoveryStatus?.source === 'environment'
                      ? 'Environment Variable'
                      : 'Default Key Active'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                The Master Recovery Key resets administrative access if you ever forget your password. It is dynamically synced with your PostgreSQL/Supabase database.
              </p>

              {/* Source Diagnostic details */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-teal-400" />
                    <span>Supabase Table:</span>
                  </span>
                  <span className="text-teal-300 font-semibold">&quot;AdminSetting&quot; (&quot;recoveryKey&quot;)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-900">
                  <span>Direct Supabase Edit:</span>
                  <span className="text-emerald-400">Fully Supported & Live</span>
                </div>
              </div>

              {/* Feedback Alert */}
              {recoveryKeyFeedback && (
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  recoveryKeyFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  {recoveryKeyFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span>{recoveryKeyFeedback.message}</span>
                </div>
              )}

              {/* Toggle to change recovery key directly from Portal */}
              {!isEditingRecoveryKey ? (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingRecoveryKey(true);
                      setRecoveryKeyFeedback(null);
                    }}
                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold underline underline-offset-2 cursor-pointer flex items-center gap-1"
                    id="toggle-edit-recovery-key-btn"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Update Recovery Key in Database</span>
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">Or edit directly in Supabase</span>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                    <span>Set New Master Recovery Key</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingRecoveryKey(false);
                        setRecoveryCurrentPassword('');
                        setNewCustomRecoveryKey('');
                        setRecoveryKeyFeedback(null);
                      }}
                      className="text-slate-400 hover:text-white text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      New Recovery Key (minimum 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewCustomRecoveryKey ? 'text' : 'password'}
                        value={newCustomRecoveryKey}
                        onChange={(e) => setNewCustomRecoveryKey(e.target.value)}
                        placeholder="e.g. My-Secure-Secret-Key-2026"
                        className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewCustomRecoveryKey(!showNewCustomRecoveryKey)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showNewCustomRecoveryKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Verify Current Admin Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRecoveryCurrentPassword ? 'text' : 'password'}
                        value={recoveryCurrentPassword}
                        onChange={(e) => setRecoveryCurrentPassword(e.target.value)}
                        placeholder="Enter active admin password"
                        className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryCurrentPassword(!showRecoveryCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showRecoveryCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingRecoveryKey || !newCustomRecoveryKey || !recoveryCurrentPassword}
                    onClick={async () => {
                      if (!recoveryCurrentPassword || !newCustomRecoveryKey) return;
                      setIsUpdatingRecoveryKey(true);
                      setRecoveryKeyFeedback(null);
                      const res = await updateRecoveryKey(recoveryCurrentPassword, newCustomRecoveryKey.trim());
                      setIsUpdatingRecoveryKey(false);
                      if (res.success) {
                        setRecoveryKeyFeedback({ type: 'success', message: res.message });
                        setRecoveryCurrentPassword('');
                        setNewCustomRecoveryKey('');
                        fetch('/api/admin/recovery-status')
                          .then((r) => r.json())
                          .then((data) => setRecoveryStatus(data))
                          .catch(() => {});
                      } else {
                        setRecoveryKeyFeedback({ type: 'error', message: res.message });
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    id="save-recovery-key-btn"
                  >
                    {isUpdatingRecoveryKey ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Supabase Database...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>Save to Supabase Database</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Access Control Settings */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-900">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
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
                  <Save className="w-3.5 h-3.5 text-teal-400" />
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
    </div>
  );
}
