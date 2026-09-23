import { useState, useEffect, useMemo } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, 
  Terminal, Server, Layers, ArrowUpRight, Copy, Check,
  Eye, Trash2, Mail, Phone, Calendar, Search, X, AlertCircle, MessageSquare
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

  // Inquiry Management States
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem[] | null | any>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<InquiryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [inquiryFeedback, setInquiryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
              <strong className="text-slate-200">Graceful Local Fallback:</strong> If DATABASE_URL is not provided or undergoing maintenance, the portal seamlessly uses local state without throwing client errors.
            </div>
          </div>
        </div>
      </div>

      {/* Client Consultation Inquiries Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
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
