import { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, 
  Terminal, Server, Layers, ArrowUpRight, Copy, Check
} from 'lucide-react';
import { useData } from '../../context/DataContext';

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
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  const sampleConnectionUri = 'postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true';

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

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleCopyUri = () => {
    navigator.clipboard.writeText(sampleConnectionUri);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            <span>Supabase Connection String Configuration</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Secret Key: DATABASE_URL
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          To connect your Supabase PostgreSQL instance, go to your <strong>Supabase Project Settings → Database → Connection String</strong>, choose <strong>URI (Transaction Mode / Port 6543)</strong>, and configure <strong>DATABASE_URL</strong> in the AI Studio Settings / Secrets panel:
        </p>

        {/* Code Snippet */}
        <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-teal-300 flex items-center justify-between overflow-x-auto">
          <code className="text-slate-300 select-all pr-10">{sampleConnectionUri}</code>
          <button
            type="button"
            onClick={handleCopyUri}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Copy sample connection string"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-start gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Zero-Restart Schema Sync:</strong> When you connect, click "Verify Tables & Seed" above to automatically create and verify all PostgreSQL tables.
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Graceful Local Fallback:</strong> If DATABASE_URL is not provided or undergoing maintenance, the portal seamlessly uses local state without throwing client errors.
            </div>
          </div>
        </div>
      </div>

      {/* Client Consultation Inquiries Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Client Inquiries & Consultation Leads</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-teal-500/20 text-teal-300">
                {inquiries.length} submissions
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Form inquiries submitted by prospective enterprise clients from the public website.
            </p>
          </div>
          <button
            type="button"
            onClick={loadInquiries}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingInquiries ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {inquiries.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
            No inquiries recorded in database yet. Submissions through the contact form will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Client Name</th>
                  <th className="p-3">Email / Contact</th>
                  <th className="p-3">Service Interest</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-semibold text-white whitespace-nowrap">{inq.fullName}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="text-slate-200">{inq.email}</div>
                      {inq.phone && <div className="text-[11px] text-slate-400">{inq.phone}</div>}
                    </td>
                    <td className="p-3 uppercase font-mono text-teal-400 whitespace-nowrap">
                      {inq.serviceCategory}
                    </td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">{inq.company || '—'}</td>
                    <td className="p-3 text-slate-400 max-w-xs truncate" title={inq.message}>
                      {inq.message}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {inq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
