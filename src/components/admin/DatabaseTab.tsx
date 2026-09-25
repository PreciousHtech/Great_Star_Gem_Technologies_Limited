import { useState, useEffect, useMemo, useRef, ChangeEvent } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, 
  /* [UNUSED - Candidate for removal]: Terminal, */ Server, Layers, /* [UNUSED - Candidate for removal]: ArrowUpRight, */ Copy, Check,
  Eye, Trash2, Mail, Phone, Calendar, Search, X, AlertCircle, MessageSquare,
  Cloud, UploadCloud, FolderOpen, /* [UNUSED - Candidate for removal]: FileVideo, Image as ImageIcon, */ Sparkles, Loader2, Key
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { 
  fetchStorageStatus, 
  updateStorageConfig, 
  uploadFileToSupabaseStorage, 
  StorageStatus, 
  UploadResult 
} from '../../utils/storageClient';

interface InquiryItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  serviceCategory: string;
  company?: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function DatabaseTab() {
  const { dbStatus, checkDbStatus, initAndSeedDatabase } = useData();
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);
  /* [UNUSED - Candidate for removal]: const [copiedUrl, setCopiedUrl] = useState(false); */
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Inquiry Management States
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem[] | null | any>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<InquiryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [inquiryFeedback, setInquiryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Supabase Storage States
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [showStorageConfig, setShowStorageConfig] = useState(false);
  const [storageKeyInput, setStorageKeyInput] = useState('');
  const [storageBucketInput, setStorageBucketInput] = useState('');
  const [storageUrlInput, setStorageUrlInput] = useState('');
  const [isSavingStorage, setIsSavingStorage] = useState(false);
  const [storageFeedback, setStorageFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Test Storage Upload States
  const testFileInputRef = useRef<HTMLInputElement>(null);
  const [testUploading, setTestUploading] = useState(false);
  const [testUploadResult, setTestUploadResult] = useState<UploadResult | null>(null);
  const [testProgressMsg, setTestProgressMsg] = useState('');
  const [copiedTestUrl, setCopiedTestUrl] = useState(false);

  /* [UNUSED - Candidate for removal]:
  const sampleConnectionUri = 'postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true';
  */

  const loadInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const res = await fetch('/api/inquiries');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data)) {
          setInquiries(data.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingInquiries(false);
    }
  };

  const loadStorageStatus = async () => {
    setLoadingStorage(true);
    try {
      const status = await fetchStorageStatus();
      setStorageStatus(status);
      if (status.bucket) setStorageBucketInput(status.bucket);
      if (status.url) setStorageUrlInput(status.url);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    loadInquiries();
    loadStorageStatus();
  }, []);

  const handleSaveStorageConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStorage(true);
    setStorageFeedback(null);
    try {
      const res = await updateStorageConfig({
        url: storageUrlInput.trim() || undefined,
        key: storageKeyInput.trim() || undefined,
        bucket: storageBucketInput.trim() || undefined,
      });
      setStorageFeedback(res);
      await loadStorageStatus();
      if (res.success) {
        setStorageKeyInput('');
      }
    } finally {
      setIsSavingStorage(false);
    }
  };

  const handleTestUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTestUploading(true);
    setTestUploadResult(null);
    setTestProgressMsg('');
    try {
      const folder = file.type.startsWith('video/') ? 'videos' : 'media';
      const res = await uploadFileToSupabaseStorage(file, folder, (msg) => {
        setTestProgressMsg(msg);
      });
      setTestUploadResult(res);
    } finally {
      setTestUploading(false);
      if (testFileInputRef.current) testFileInputRef.current.value = '';
    }
  };

  const handleCopyTestUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTestUrl(true);
    setTimeout(() => setCopiedTestUrl(false), 2000);
  };

  /* [UNUSED - Candidate for removal]:
  const handleCopyUri = () => {
    navigator.clipboard.writeText(sampleConnectionUri);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };
  */

  const handleSyncDb = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const result = await initAndSeedDatabase();
      setSyncFeedback(result);
      await loadInquiries();
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInquiries((prev) => prev.filter((item) => item.id !== id));
        if (selectedInquiry?.id === id) {
          setSelectedInquiry(null);
        }
        setInquiryToDelete(null);
        setInquiryFeedback({
          type: 'success',
          message: 'Inquiry record permanently deleted through admin portal.',
        });
        setTimeout(() => setInquiryFeedback(null), 4000);
      } else {
        setInquiryFeedback({
          type: 'error',
          message: 'Failed to delete inquiry from database.',
        });
      }
    } catch {
      setInquiryFeedback({
        type: 'error',
        message: 'Network error communicating with backend.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchesSearch = 
        inq.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inq.company && inq.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        inq.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        categoryFilter === 'all' || 
        inq.serviceCategory.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [inquiries, searchQuery, categoryFilter]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span>PostgreSQL & Supabase Engine</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Prisma ORM v6
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Direct connection pooling and real-time schema synchronization for enterprise data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => checkDbStatus()}
            disabled={dbStatus.checking}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            id="db-refresh-status-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dbStatus.checking ? 'animate-spin' : ''}`} />
            <span>{dbStatus.checking ? 'Checking...' : 'Check Ping'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncDb}
            disabled={syncing || !dbStatus.connected}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
            id="db-sync-btn"
          >
            <Layers className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizing...' : 'Verify Tables & Seed'}</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Message */}
      {syncFeedback && (
        <div 
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            syncFeedback.success 
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
              : 'bg-red-950/40 border-red-800/60 text-red-300'
          }`}
        >
          {syncFeedback.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* Connection Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Status Indicator */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Connection State</span>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono ${
              dbStatus.connected 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>{dbStatus.connected ? 'Connected' : 'Awaiting Config'}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-semibold text-white">
              {dbStatus.connected ? 'Active PostgreSQL Database' : 'DATABASE_URL Pending'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {dbStatus.message}
            </div>
          </div>
        </div>

        {/* Latency & Server Time */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Response Latency</span>
            <Server className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-white">
              {dbStatus.latencyMs !== undefined ? `${dbStatus.latencyMs} ms` : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1 truncate">
              {dbStatus.serverTime ? `Database time: ${new Date(dbStatus.serverTime).toLocaleTimeString()}` : 'Local cache active'}
            </div>
          </div>
        </div>

        {/* Persisted Records */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Synchronized Records</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="bg-slate-800 px-2 py-1 rounded text-teal-300">
                Projects: <strong>{dbStatus.counts?.projects ?? 0}</strong>
              </span>
              <span className="bg-slate-800 px-2 py-1 rounded text-emerald-300">
                Reviews: <strong>{dbStatus.counts?.testimonials ?? 0}</strong>
              </span>
              <span className="bg-slate-800 px-2 py-1 rounded text-cyan-300">
                Inquiries: <strong>{dbStatus.counts?.inquiries ?? inquiries.length}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Prisma model entities mapped in PostgreSQL
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Connection Setup Instructions */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-start gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Zero-Restart Schema Sync:</strong> When you connect, click "Verify Tables & Seed" above to automatically create and verify all PostgreSQL tables.
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Supabase Recovery Key:</strong> The <code className="text-teal-300 font-mono text-[11px]">AdminSetting.recoveryKey</code> column in Supabase lets you view or change your recovery key directly in the table editor.
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Graceful Local Fallback:</strong> If database url is not provided or undergoing maintenance, the portal seamlessly uses local state without throwing client errors.
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUPABASE CLOUD STORAGE SERVICE (MEDIA & VIDEO CDN) */}
      {/* ======================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4" id="supabase-storage-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Supabase Cloud Storage (Images & Videos CDN)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                  storageStatus?.configured
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}>
                  {storageStatus?.configured ? 'Active & Ready' : 'API Key Pending'}
                </span>
                {storageStatus?.bucket && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-teal-300">
                    Bucket: {storageStatus.bucket}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload images and video files to Supabase Storage. The public CDN URL is saved directly into PostgreSQL via Prisma.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={loadStorageStatus}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[38px]"
              title="Refresh Storage Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStorage ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setShowStorageConfig(!showStorageConfig)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[38px]"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{showStorageConfig ? 'Hide Config' : 'Configure Bucket & Key'}</span>
            </button>
          </div>
        </div>

        {/* Explanatory architectural notes */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs text-slate-300 leading-relaxed">
          <div className="font-semibold text-teal-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>How Supabase Storage Integrates with Prisma & PostgreSQL:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-slate-400">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <strong className="text-slate-200 block mb-1">1. Direct Upload to Bucket</strong>
              Video and image files are uploaded directly to the Supabase Storage bucket (default: <code className="text-teal-300">media</code>).
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <strong className="text-slate-200 block mb-1">2. Instant Public CDN URL</strong>
              Supabase generates an immutable public URL: <code className="text-teal-300 text-[10px]">https://[ref].supabase.co/storage/v1/object/public/...</code>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <strong className="text-slate-200 block mb-1">3. Clean Text in Postgres</strong>
              Only the clean URL string is saved in your database (<code className="text-teal-300">Project.videoUrl</code> or <code className="text-teal-300">Project.image</code>). No database bloat!
            </div>
          </div>
        </div>

        {/* Configuration Form (Expanded when clicked or if pending) */}
        {showStorageConfig && (
          <form onSubmit={handleSaveStorageConfig} className="p-4 rounded-xl bg-slate-950 border border-teal-500/30 space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-teal-400" />
                <span>Supabase Storage Credentials & Target Bucket</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Auto-saved to backend config</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={storageUrlInput}
                  onChange={(e) => setStorageUrlInput(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500 min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Storage Bucket Name
                </label>
                <input
                  type="text"
                  value={storageBucketInput}
                  onChange={(e) => setStorageBucketInput(e.target.value)}
                  placeholder="media"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500 min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase API Key (Anon or Service Role)
                </label>
                <input
                  type="password"
                  value={storageKeyInput}
                  onChange={(e) => setStorageKeyInput(e.target.value)}
                  placeholder={storageStatus?.hasKey ? '•••••••••••••••• (Saved in Cache)' : 'eyJh... Paste Supabase API Key'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500 min-h-[38px]"
                />
              </div>
            </div>

            {storageFeedback && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                storageFeedback.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'
              }`}>
                {storageFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                <span>{storageFeedback.message}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-400">
                You can also define <code className="text-teal-300">SUPABASE_URL</code> and <code className="text-teal-300">SUPABASE_ANON_KEY</code> in your environment variables.
              </span>
              <button
                type="submit"
                disabled={isSavingStorage}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[38px]"
              >
                {isSavingStorage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Storage Config</span>
              </button>
            </div>
          </form>
        )}

        {/* Quick Test Upload Section */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-teal-400" />
              <span>Test Direct File Upload to Supabase Storage</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Upload any MP4 video or JPG/PNG image to test connectivity and generate an instant public CDN URL.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={testFileInputRef}
              onChange={handleTestUpload}
              accept="video/*,image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => testFileInputRef.current?.click()}
              disabled={testUploading}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
            >
              {testUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                  <span>Uploading to Supabase...</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-3.5 h-3.5 text-teal-400" />
                  <span>Choose Test File</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Upload Result */}
        {testProgressMsg && (
          <div className="text-xs text-teal-300 font-mono flex items-center gap-2 px-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>{testProgressMsg}</span>
          </div>
        )}

        {testUploadResult && (
          <div className={`p-3.5 rounded-xl text-xs border ${
            testUploadResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            {testUploadResult.success && testUploadResult.url ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Upload Successful! Public Supabase CDN URL:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyTestUrl(testUploadResult.url!)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedTestUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTestUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-teal-300 break-all select-all border border-emerald-500/20">
                  {testUploadResult.url}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-300">Upload Note:</div>
                  <div className="text-[11px] text-amber-200/90 mt-0.5">{testUploadResult.error}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client Consultation Inquiries Table */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-400" />
              <span>Client Inquiries & Consultation Leads</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {inquiries.length} {inquiries.length === 1 ? 'submission' : 'submissions'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Read messages in full, respond to prospective clients, and permanently delete inquiries directly through the admin portal.
            </p>
          </div>
          <button
            type="button"
            onClick={loadInquiries}
            className="self-start sm:self-auto px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingInquiries ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {inquiryFeedback && (
          <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
            inquiryFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {inquiryFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{inquiryFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setInquiryFeedback(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        {inquiries.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client name, email, company, or message..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Service Verticals</option>
              <option value="web-application">Web Application</option>
              <option value="ict">ICT Solutions</option>
              <option value="conference">Global Conferences</option>
              <option value="solar">Solar Power</option>
              <option value="engineering">Engineering Services</option>
              <option value="real-estate">Real Estate</option>
            </select>
          </div>
        )}

        {inquiries.length === 0 ? null : filteredInquiries.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
            No inquiries matched "{searchQuery}". <button onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }} className="text-teal-400 underline font-semibold cursor-pointer">Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Client & Company</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Service Interest</th>
                  <th className="p-3">Message Snippet</th>
                  <th className="p-3">Received</th>
                  <th className="p-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                {filteredInquiries.map((inq) => (
                  <tr 
                    key={inq.id} 
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="p-3">
                      <div className="font-semibold text-white">{inq.fullName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {inq.company || 'Direct Client'}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <a 
                        href={`mailto:${inq.email}`} 
                        className="text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
                        title="Send Email"
                      >
                        <Mail className="w-3 h-3" />
                        <span>{inq.email}</span>
                      </a>
                      {inq.phone && (
                        <a 
                          href={`tel:${inq.phone}`} 
                          className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 mt-0.5"
                          title="Call Phone"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{inq.phone}</span>
                        </a>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-teal-500/10 text-teal-300 border border-teal-500/25">
                        {inq.serviceCategory}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="text-slate-300 truncate" title={inq.message}>
                        {inq.message}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedInquiry(inq)}
                        className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold underline mt-0.5 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read full message</span>
                      </button>
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-400 text-[11px] font-mono">
                      {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : '—'}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Read Full Message button */}
                        <button
                          type="button"
                          onClick={() => setSelectedInquiry(inq)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-all flex items-center gap-1 cursor-pointer"
                          title="Read full inquiry details"
                          id={`view-inquiry-${inq.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Read</span>
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => setInquiryToDelete(inq)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 hover:border-red-700 transition-all flex items-center gap-1 cursor-pointer"
                          title="Delete inquiry through admin portal"
                          id={`delete-inquiry-${inq.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span className="hidden md:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Full Inquiry Reader */}
      {selectedInquiry && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedInquiry(null)}
        >
          <div 
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            id="full-inquiry-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Client Inquiry Dossier</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      {selectedInquiry.serviceCategory}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {selectedInquiry.id}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Full Name / Lead</div>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedInquiry.fullName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Organization / Project Type</div>
                  <div className="text-sm font-medium text-slate-200 mt-0.5">{selectedInquiry.company || 'Not Specified'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Official Email</div>
                  <a 
                    href={`mailto:${selectedInquiry.email}`}
                    className="text-xs font-semibold text-teal-400 hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{selectedInquiry.email}</span>
                  </a>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Phone Number</div>
                  {selectedInquiry.phone ? (
                    <a 
                      href={`tel:${selectedInquiry.phone}`}
                      className="text-xs font-semibold text-slate-200 hover:text-teal-300 flex items-center gap-1.5 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-400" />
                      <span>{selectedInquiry.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-500 italic mt-0.5 block">None provided</span>
                  )}
                </div>
              </div>

              {/* Timestamp & Status info */}
              <div className="flex items-center justify-between px-2 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Received: {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString() : 'N/A'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase text-[10px]">
                  Status: {selectedInquiry.status || 'Active'}
                </span>
              </div>

              {/* Full Message Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span>Complete Client Message:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(selectedInquiry.message)}
                    className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedMessage ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMessage ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap selection:bg-teal-500/30 select-text font-sans">
                  {selectedInquiry.message}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-800 bg-slate-950">
              <button
                type="button"
                onClick={() => {
                  const target = selectedInquiry;
                  setInquiryToDelete(target);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-800/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                id="modal-delete-inquiry-btn"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete Inquiry</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=RE: Great Star Gem Enterprise Consultation - ${selectedInquiry.serviceCategory}`}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/25"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Inquiry Confirmation */}
      {inquiryToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !deletingId && setInquiryToDelete(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-red-900/50 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
            id="delete-confirmation-modal"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Permanently Delete Inquiry?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete the consultation lead from <strong className="text-white">{inquiryToDelete.fullName}</strong> ({inquiryToDelete.email})?
              </p>
              <p className="text-[11px] text-slate-500">
                This will delete the lead directly through the admin portal without having to open the database console. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setInquiryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => handleDeleteInquiry(inquiryToDelete.id)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-red-600/30"
                id="confirm-delete-inquiry-btn"
              >
                {deletingId ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
