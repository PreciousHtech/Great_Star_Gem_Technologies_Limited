import { useState, useMemo, useEffect, FormEvent } from 'react';
import { 
  ShieldCheck, Key, Lock, Terminal, CheckCircle2, Copy, RefreshCw, 
  AlertTriangle, Eye, EyeOff, Save, Globe, Check, X, ShieldAlert,
  Loader2, AlertCircle, QrCode, Smartphone, Download, KeyRound, ExternalLink, Shield, LifeBuoy
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { checkPasswordStrength } from '../../utils/passwordValidator';

export default function SecuritySettingsTab() {
  const { adminSettings, updateAdminSettings, changeAdminPassword, verifyCurrentPassword } = useData();

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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(adminSettings.twoFactorEnabled);
  const [sessionTimeout, setSessionTimeout] = useState(adminSettings.sessionTimeoutMinutes || 30);
  const [ipAllowlist, setIpAllowlist] = useState(adminSettings.ipAllowlist || '197.210.0.0/16\n127.0.0.1');
  const [publicApiEnabled, setPublicApiEnabled] = useState(adminSettings.publicApiEnabled);

  // 2FA TOTP Interactive Management State
  const [twoFactorStatus, setTwoFactorStatus] = useState<{
    twoFactorEnabled: boolean;
    isConfigured: boolean;
    backupCodesRemaining: number;
  }>({
    twoFactorEnabled: false,
    isConfigured: false,
    backupCodesRemaining: 0,
  });
  const [isLoading2FAStatus, setIsLoading2FAStatus] = useState(false);

  // Master Recovery Key status
  const [recoveryStatus, setRecoveryStatus] = useState<{
    enabled: boolean;
    hasCustomKey: boolean;
    defaultKeyHint?: string;
  } | null>(null);

  // Setup Modal State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'backup' | 'verify'>('qr');
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    uri: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingSetup, setIsVerifyingSetup] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Disable 2FA Modal State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Regenerate Backup Codes Modal State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [regeneratedCodes, setRegeneratedCodes] = useState<string[]>([]);
  const [isRegeneratingBackup, setIsRegeneratingBackup] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch 2FA Status on mount
  const fetch2FAStatus = async () => {
    setIsLoading2FAStatus(true);
    try {
      const res = await fetch('/api/admin/2fa/status');
      const data = await res.json();
      if (res.ok && data.success) {
        setTwoFactorStatus({
          twoFactorEnabled: Boolean(data.twoFactorEnabled),
          isConfigured: Boolean(data.isConfigured),
          backupCodesRemaining: data.backupCodesRemaining || 0,
        });
        setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
      }
    } catch (err) {
      console.error('Failed to load 2FA status:', err);
    } finally {
      setIsLoading2FAStatus(false);
    }
  };

  useEffect(() => {
    fetch2FAStatus();
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
      // If user is attempting to change password
      if (newPassword || currentPassword || confirmPassword) {
        // 1. Current password cannot be empty
        if (!currentPassword) {
          setCurrentPasswordStatus('invalid');
          setCurrentPasswordFeedback('Current password is required before you can change your password.');
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

      // Update username if changed
      if (username !== adminSettings.username) {
        updateAdminSettings({ username });
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordStatus('idle');
      setCurrentPasswordFeedback('');
      setFeedback({ 
        type: 'success', 
        message: 'Admin security credentials verified and updated successfully in database. Plain text is never stored.' 
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

  // 2FA TOTP Action Handlers
  const handleStartSetup = async () => {
    setSetupError(null);
    setVerificationCode('');
    setSetupStep('qr');
    setIsLoadingSetup(true);
    setIsSetupModalOpen(true);
    try {
      const res = await fetch('/api/admin/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSetupData({
          secret: data.secret,
          uri: data.uri,
          qrCodeDataUrl: data.qrCodeDataUrl,
          backupCodes: data.backupCodes,
        });
      } else {
        setSetupError(data.message || 'Failed to initialize 2FA setup.');
      }
    } catch {
      setSetupError('Network error initializing 2FA setup.');
    } finally {
      setIsLoadingSetup(false);
    }
  };

  const handleActivate2FA = async (e: FormEvent) => {
    e.preventDefault();
    if (!setupData || verificationCode.length !== 6) return;
    setIsVerifyingSetup(true);
    setSetupError(null);
    try {
      const res = await fetch('/api/admin/2fa/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: setupData.secret,
          code: verificationCode,
          backupCodes: setupData.backupCodes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSetupModalOpen(false);
        setTwoFactorStatus({
          twoFactorEnabled: true,
          isConfigured: true,
          backupCodesRemaining: data.backupCodesRemaining || setupData.backupCodes.length,
        });
        setTwoFactorEnabled(true);
        updateAdminSettings({ twoFactorEnabled: true });
        setFeedback({
          type: 'success',
          message: 'Two-Factor Authentication activated successfully! TOTP protection is now active.',
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setSetupError(data.message || 'Invalid 6-digit code. Check your authenticator app and try again.');
      }
    } catch {
      setSetupError('Network error while verifying 2FA code.');
    } finally {
      setIsVerifyingSetup(false);
    }
  };

  const handleDisable2FA = async (e: FormEvent) => {
    e.preventDefault();
    setIsDisabling2FA(true);
    setDisableError(null);
    try {
      const res = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: disablePassword,
          code: disableCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsDisableModalOpen(false);
        setDisablePassword('');
        setDisableCode('');
        setTwoFactorStatus(prev => ({ ...prev, twoFactorEnabled: false }));
        setTwoFactorEnabled(false);
        updateAdminSettings({ twoFactorEnabled: false });
        setFeedback({
          type: 'success',
          message: 'Two-Factor Authentication has been disabled for the administrator account.',
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setDisableError(data.message || 'Could not disable 2FA. Please verify your password or code.');
      }
    } catch {
      setDisableError('Network error while disabling 2FA.');
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const handleRegenerateBackupCodes = async (e: FormEvent) => {
    e.preventDefault();
    setIsRegeneratingBackup(true);
    setRegenerateError(null);
    try {
      const res = await fetch('/api/admin/2fa/regenerate-backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: regeneratePassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegeneratedCodes(data.backupCodes);
        setTwoFactorStatus(prev => ({
          ...prev,
          backupCodesRemaining: data.backupCodes.length,
        }));
        setRegeneratePassword('');
        setFeedback({
          type: 'success',
          message: 'Generated 6 new emergency recovery backup codes. Previous codes have been superseded.',
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setRegenerateError(data.message || 'Password verification failed.');
      }
    } catch {
      setRegenerateError('Network error while regenerating backup codes.');
    } finally {
      setIsRegeneratingBackup(false);
    }
  };

  const handleCopyCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  const handleDownloadCodes = (codes: string[]) => {
    const text = `GREAT STAR GEM - ADMIN EMERGENCY RECOVERY BACKUP CODES\nGenerated: ${new Date().toISOString()}\n\nEach code can only be used once:\n\n${codes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nKeep these codes in a secure location (e.g., password manager).`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'greatstargem-admin-2fa-backup-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSecuritySettings = (e: FormEvent) => {
    e.preventDefault();
    updateAdminSettings({
      apiToken,
      webhookSecret,
      twoFactorEnabled,
      sessionTimeoutMinutes: Number(sessionTimeout),
      ipAllowlist,
      publicApiEnabled
    });
    setFeedback({ type: 'success', message: 'Access control settings and security policies saved.' });
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
                  Update primary administrative login identifier and security password. Once changed, your new password takes precedence and is permanently saved in the database, replacing any default set in your .env.
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
                If you ever forget your password or lose access to your authenticator app, click &quot;Reset with Recovery Key&quot; on the login page to bypass lockout and configure new credentials.
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
                  Access Control Policies
                </h3>
                <p className="text-xs text-slate-400">
                  Configure session lifespan, multi-factor authorization, and IP network filters.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSecuritySettings} className="space-y-4" id="access-control-form">
              {/* Interactive Two-Factor Authentication (2FA) Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5" id="admin-2fa-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      twoFactorStatus.twoFactorEnabled 
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                        : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                    }`}>
                      {twoFactorStatus.twoFactorEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Two-Factor Authentication (2FA)
                        </span>
                        {twoFactorStatus.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active & Protected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            Not Activated
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {twoFactorStatus.twoFactorEnabled
                          ? `Protected by TOTP (Google Authenticator / Authy / 1Password). ${twoFactorStatus.backupCodesRemaining} single-use recovery backup codes remaining.`
                          : 'Protect the admin console by requiring a 6-digit TOTP verification code from an authenticator app upon signing in.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  {twoFactorStatus.twoFactorEnabled ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsBackupModalOpen(true);
                          setRegeneratedCodes([]);
                          setRegeneratePassword('');
                          setRegenerateError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        id="manage-backup-codes-btn"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                        <span>Backup Codes ({twoFactorStatus.backupCodesRemaining})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStartSetup}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        id="reconfigure-2fa-btn"
                      >
                        <QrCode className="w-3.5 h-3.5 text-purple-400" />
                        <span>Re-scan QR Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDisableModalOpen(true);
                          setDisablePassword('');
                          setDisableCode('');
                          setDisableError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer sm:ml-auto"
                        id="disable-2fa-btn"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        <span>Disable 2FA</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartSetup}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      id="setup-2fa-btn"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Set Up Authenticator (QR Code Scanner)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Session Inactivity Timeout */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Session Timeout
                </label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value={15}>15 Minutes of Inactivity</option>
                  <option value={30}>30 Minutes of Inactivity</option>
                  <option value={60}>1 Hour Session Duration</option>
                  <option value={480}>8 Hours (Full Shift)</option>
                </select>
              </div>

              {/* IP Allowlist */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  IP Allowlist (One CIDR / IP per line)
                </label>
                <textarea
                  rows={2}
                  value={ipAllowlist}
                  onChange={(e) => setIpAllowlist(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="197.210.0.0/16&#10;127.0.0.1"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  id="save-access-control-btn"
                >
                  <Save className="w-3.5 h-3.5 text-purple-400" />
                  <span>Save Access Control</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Firewall Status: Active</span>
            <span className="text-emerald-400 font-mono">ENFORCING</span>
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

      {/* ========================================================================= */}
      {/* MODAL 1: Interactive TOTP Two-Factor Authentication Setup Modal */}
      {/* ========================================================================= */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                    Set Up Two-Factor Authentication
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    TOTP Authenticator (Google Authenticator, Authy, 1Password)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSetupModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-between mb-6 px-2">
              <button
                type="button"
                onClick={() => setSetupStep('qr')}
                className={`flex items-center gap-1.5 text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${
                  setupStep === 'qr' ? 'text-purple-400 border-purple-500' : 'text-slate-500 border-transparent'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
                <span>Scan QR</span>
              </button>
              <button
                type="button"
                onClick={() => setSetupStep('backup')}
                className={`flex items-center gap-1.5 text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${
                  setupStep === 'backup' ? 'text-purple-400 border-purple-500' : 'text-slate-500 border-transparent'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
                <span>Backup Codes</span>
              </button>
              <button
                type="button"
                onClick={() => setSetupStep('verify')}
                className={`flex items-center gap-1.5 text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${
                  setupStep === 'verify' ? 'text-purple-400 border-purple-500' : 'text-slate-500 border-transparent'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
                <span>Verify & Activate</span>
              </button>
            </div>

            {/* Error Feedback in Modal */}
            {setupError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{setupError}</span>
              </div>
            )}

            {isLoadingSetup ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Generating cryptographic TOTP key and high-resolution QR code...</p>
              </div>
            ) : setupData ? (
              <>
                {/* STEP 1: Scan QR Code */}
                {setupStep === 'qr' && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <p className="text-xs text-slate-300 font-medium">
                        Open your authenticator app (Google Authenticator, Authy, or 1Password) and scan this QR code:
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-xl shadow-purple-950/40 border border-purple-500/20">
                      <img
                        src={setupData.qrCodeDataUrl}
                        alt="TOTP Setup QR Code"
                        className="w-48 h-48 block"
                      />
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Cannot scan? Enter manual secret key:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(setupData.secret);
                            setCopiedSecret(true);
                            setTimeout(() => setCopiedSecret(false), 2000);
                          }}
                          className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSecret ? 'Copied Key!' : 'Copy Key'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs text-purple-300 bg-slate-950 p-2 rounded-lg text-center tracking-widest select-all border border-slate-800/80">
                        {setupData.secret}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSetupStep('backup')}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Next: Save Recovery Backup Codes →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Recovery Backup Codes */}
                {setupStep === 'backup' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Emergency Recovery Backup Codes</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        If you ever lose access to your phone or authenticator app, each of these single-use codes will allow you to sign into the admin portal. Store them safely.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      {setupData.backupCodes.map((code, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950 border border-slate-800/80 rounded-lg p-2 text-center font-mono text-xs text-slate-200 tracking-wider"
                        >
                          {code}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCodes(setupData.backupCodes)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedBackupCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBackupCodes ? 'All Codes Copied!' : 'Copy All Codes'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadCodes(setupData.backupCodes)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-400" />
                        <span>Download (.txt)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSetupStep('qr')}
                        className="py-3 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                      >
                        ← Back to QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setSetupStep('verify')}
                        className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Next: Verify & Activate →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Verify and Activate */}
                {setupStep === 'verify' && (
                  <form onSubmit={handleActivate2FA} className="space-y-4">
                    <div className="space-y-1 text-center">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 mb-2">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Enter 6-Digit Authenticator Code</h4>
                      <p className="text-xs text-slate-400">
                        Enter the temporary 6-digit code shown in your authenticator app to complete activation.
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus
                        required
                        value={verificationCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                          setVerificationCode(val);
                        }}
                        placeholder="••••••"
                        maxLength={6}
                        className="w-full py-3.5 px-4 text-center font-mono text-2xl tracking-[0.4em] rounded-xl bg-slate-900 border border-slate-700 text-purple-300 focus:outline-none focus:border-purple-500 transition-colors"
                        id="verify-setup-code-input"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSetupStep('backup')}
                        className="py-3 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                      >
                        ← Back
                      </button>

                      <button
                        type="submit"
                        disabled={isVerifyingSetup || verificationCode.length !== 6}
                        className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        id="activate-2fa-btn"
                      >
                        {isVerifyingSetup ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Activating 2FA...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify & Activate 2FA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Disable Two-Factor Authentication Modal */}
      {/* ========================================================================= */}
      {isDisableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                    Disable Two-Factor Authentication
                  </h3>
                  <p className="text-[11px] text-slate-400">Confirmation required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDisableModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Disabling 2FA reduces your administrator account security. You will only need a password to sign in.
            </p>

            {disableError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{disableError}</span>
              </div>
            )}

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Current Administrator Password
                </label>
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                  id="disable-2fa-password-input"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisableModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisabling2FA || !disablePassword}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  id="confirm-disable-2fa-btn"
                >
                  {isDisabling2FA ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  <span>{isDisabling2FA ? 'Disabling...' : 'Confirm Disable'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Emergency Backup Codes & Regeneration Modal */}
      {/* ========================================================================= */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit',sans-serif]">
                    Emergency Recovery Backup Codes
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {twoFactorStatus.backupCodesRemaining} single-use codes currently remaining
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regenerateError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{regenerateError}</span>
              </div>
            )}

            {regeneratedCodes.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>6 fresh emergency recovery codes generated! Previous codes are now invalid.</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  {regeneratedCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 rounded-lg p-2 text-center font-mono text-xs text-slate-200 tracking-wider"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCodes(regeneratedCodes)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedBackupCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBackupCodes ? 'Copied!' : 'Copy All'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadCodes(regeneratedCodes)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>Download (.txt)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBackupModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegenerateBackupCodes} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  To regenerate 6 new single-use emergency backup codes, enter your current administrator password below. Note that generating new codes will immediately invalidate any previous codes.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Current Administrator Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regeneratePassword}
                    onChange={(e) => setRegeneratePassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    id="regenerate-backup-password-input"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBackupModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isRegeneratingBackup || !regeneratePassword}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    id="submit-regenerate-backup-btn"
                  >
                    {isRegeneratingBackup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>{isRegeneratingBackup ? 'Generating...' : 'Generate New Codes'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
