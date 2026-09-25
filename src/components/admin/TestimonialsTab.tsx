import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { 
  Quote, Star, Edit3, Trash2, CheckCircle2, User, Building, 
  Image as ImageIcon, RefreshCw, X, AlertCircle, FolderOpen, /* [UNUSED - Candidate for removal]: Upload, */
  Cloud, Sparkles, Loader2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { TestimonialItem } from '../../types';
import TestimonialAvatar, { getFirstNameInitial } from '../TestimonialAvatar';
import { uploadFileToSupabaseStorage } from '../../utils/storageClient';

export default function TestimonialsTab() {
  const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial, deleteAllTestimonials, resetTestimonials } = useData();

  // "UPLOAD NEW TESTIMONIAL" Form states
  const [clientName, setClientName] = useState('');
  const [roleCompany, setRoleCompany] = useState('');
  const [clientAvatar, setClientAvatar] = useState('');
  const [testimonialContent, setTestimonialContent] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Edit Modal states
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoleCompany, setEditRoleCompany] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editQuote, setEditQuote] = useState('');

  // Delete All Modal states
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Delete Confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // File Upload from Folder refs and file name tracking
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [clientAvatarFileName, setClientAvatarFileName] = useState('');
  const [editAvatarFileName, setEditAvatarFileName] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  /**
   * Reads an image file from the user's device/folder and scales it to an optimal
   * avatar resolution (~500px) in Base64 format for fast persistence & display.
   */
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawData = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.88));
              return;
            }
          }
          resolve(rawData);
        };
        img.onerror = () => resolve(rawData);
        img.src = rawData;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const [avatarUploadStatus, setAvatarUploadStatus] = useState<string | null>(null);
  const [avatarStorageType, setAvatarStorageType] = useState<'supabase' | 'local' | null>(null);
  const [editAvatarUploadStatus, setEditAvatarUploadStatus] = useState<string | null>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingFile(true);
      setClientAvatarFileName(file.name);
      setAvatarUploadStatus('Uploading avatar to Supabase Storage bucket...');

      // Attempt direct Supabase Storage bucket upload
      const uploadRes = await uploadFileToSupabaseStorage(file, 'testimonials', (msg) => {
        setAvatarUploadStatus(msg);
      });

      if (uploadRes.success && uploadRes.url) {
        // Direct public CDN URL returned from Supabase bucket
        setClientAvatar(uploadRes.url);
        setAvatarStorageType('supabase');
        setAvatarUploadStatus('✓ Stored in Supabase Storage CDN.');
        return;
      }

      // Fallback to local optimized base64
      const base64 = await processImageFile(file);
      setClientAvatar(base64);
      setAvatarStorageType('local');
      setAvatarUploadStatus(uploadRes.requiresKey 
        ? 'Using local preview (Configure Supabase Storage in Database tab for Cloud CDN)' 
        : 'Image attached');
    } catch (err) {
      console.error('Failed to load image from folder:', err);
      setClientAvatarFileName('');
      setAvatarUploadStatus(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleEditFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingFile(true);
      setEditAvatarFileName(file.name);
      setEditAvatarUploadStatus('Uploading to Supabase Storage...');

      // Attempt direct Supabase Storage bucket upload
      const uploadRes = await uploadFileToSupabaseStorage(file, 'testimonials', (msg) => {
        setEditAvatarUploadStatus(msg);
      });

      if (uploadRes.success && uploadRes.url) {
        setEditAvatar(uploadRes.url);
        setEditAvatarUploadStatus('✓ Stored in Supabase CDN.');
        return;
      }

      const base64 = await processImageFile(file);
      setEditAvatar(base64);
      setEditAvatarUploadStatus(uploadRes.requiresKey ? 'Local image loaded' : null);
    } catch (err) {
      console.error('Failed to load image from folder:', err);
      setEditAvatarFileName('');
      setEditAvatarUploadStatus(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleUploadSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !testimonialContent.trim()) return;

    // Parse role and company if provided with / or ,
    let role = roleCompany.trim();
    let organization = 'Enterprise Client';
    if (roleCompany.includes('/')) {
      const parts = roleCompany.split('/');
      role = parts[0].trim();
      organization = parts[1].trim();
    } else if (roleCompany.includes(',')) {
      const parts = roleCompany.split(',');
      role = parts[0].trim();
      organization = parts[1].trim();
    }

    addTestimonial({
      name: clientName.trim(),
      role: role || 'Client',
      organization: organization || 'Partner',
      quote: testimonialContent.trim(),
      avatar: clientAvatar.trim(),
      rating: 5,
      country: 'Global Partner',
      serviceCategory: 'web-application',
      createdAt: new Date().toISOString().split('T')[0]
    });

    setClientName('');
    setRoleCompany('');
    setClientAvatar('');
    setClientAvatarFileName('');
    setAvatarUploadStatus(null);
    setAvatarStorageType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTestimonialContent('');
    setStatusMessage(`Testimonial from "${clientName}" uploaded live.`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleOpenEdit = (item: TestimonialItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditRoleCompany(item.organization ? `${item.role} / ${item.organization}` : item.role);
    setEditAvatar(item.avatar || '');
    setEditAvatarFileName(item.avatar?.startsWith('data:') ? 'Uploaded image' : '');
    setEditQuote(item.quote);
  };

  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    let role = editRoleCompany.trim();
    let organization = editingItem.organization;
    if (editRoleCompany.includes('/')) {
      const parts = editRoleCompany.split('/');
      role = parts[0].trim();
      organization = parts[1].trim();
    }

    updateTestimonial(editingItem.id, {
      name: editName.trim(),
      role: role,
      organization: organization,
      avatar: editAvatar.trim(),
      quote: editQuote.trim()
    });

    setEditingItem(null);
    setStatusMessage(`Testimonial for "${editName}" updated successfully.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDelete = (id: string) => {
    deleteTestimonial(id);
    setDeleteConfirmId(null);
    setStatusMessage('Testimonial removed from live showcase.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-10">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center gap-2.5 text-xs text-teal-200 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TOP SECTION: UPLOAD NEW TESTIMONIAL Form */}
      <section className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden" id="upload-new-testimonial-section">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-900">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-mono uppercase font-bold tracking-wider mb-2">
              <span>DYNAMIC FEED</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
              UPLOAD NEW TESTIMONIAL
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Add authentic developer recommendations and client reviews to stream immediately to the public landing page.
            </p>
          </div>

          <button
            type="button"
            onClick={resetTestimonials}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start cursor-pointer"
            title="Reset seeded testimonials"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Default Testimonials</span>
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4" id="upload-testimonial-form">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Field 1: Client Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Client Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Sir Richard Sodienye Pepple"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition-colors"
                  id="testimonial-client-name"
                />
              </div>
            </div>

            {/* Field 2: Role/Company */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Role / Company *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={roleCompany}
                  onChange={(e) => setRoleCompany(e.target.value)}
                  placeholder="e.g., Supervisor / Technoville Innovation"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition-colors"
                  id="testimonial-role-company"
                />
              </div>
            </div>

            {/* Field 3: Client Avatar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Client Image (Optional)
                </label>
                <div className="flex items-center gap-2">
                  {avatarStorageType === 'supabase' || clientAvatar?.includes('supabase.co') ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                      Supabase CDN
                    </span>
                  ) : null}
                  {clientAvatar.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientAvatar('');
                        setClientAvatarFileName('');
                        setAvatarUploadStatus(null);
                        setAvatarStorageType(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer transition-colors"
                      title="Clear image and revert to teal initial avatar"
                    >
                      <X className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                  <span className="text-[11px] text-teal-400 font-medium truncate max-w-[150px]">
                    {clientAvatar.trim() ? (clientAvatarFileName || (clientAvatar.startsWith('data:') ? 'Uploaded Image' : 'Custom Image')) : 'Avatar'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Text/URL Input */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={clientAvatarFileName || (clientAvatar.startsWith('data:') ? 'Uploaded Image' : clientAvatar)}
                    onChange={(e) => {
                      setClientAvatar(e.target.value);
                      setClientAvatarFileName('');
                      setAvatarStorageType(null);
                      setAvatarUploadStatus(null);
                    }}
                    placeholder="Paste Image URL or browse folder..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm sm:text-xs focus:outline-none focus:border-teal-500 transition-colors truncate min-h-[42px]"
                    id="testimonial-avatar-url"
                  />
                </div>

                {/* Hidden File Input for Folder Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                  id="testimonial-upload-file-input"
                />

                <div className="flex items-center gap-2">
                  {/* Browse Folder Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFile}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 hover:border-teal-500/50 min-h-[42px]"
                    title="Upload client image to Supabase Storage"
                  >
                    {isProcessingFile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="w-3.5 h-3.5 text-teal-400" />
                        <span>Browse</span>
                      </>
                    )}
                  </button>

                  {/* Live Preview Avatar */}
                  <div className="shrink-0" title="Avatar Preview">
                    <TestimonialAvatar
                      name={clientName || 'User'}
                      avatar={clientAvatar}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {avatarUploadStatus && (
                <div className="text-[11px] text-teal-300 font-mono mt-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
                  <span>{avatarUploadStatus}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-400 mt-1">
                Upload from your computer/folder or paste a link. Stored directly to your Supabase Storage bucket. If no image is provided, a initials avatar will be generated.
              </p>
            </div>
          </div>

          {/* Field 4: Testimonial Content */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Testimonial Content *
            </label>
            <textarea
              required
              rows={3}
              value={testimonialContent}
              onChange={(e) => setTestimonialContent(e.target.value)}
              placeholder="Enter verbatim client review, endorsement, or project appraisal (e.g., 'Great technical collaboration on web development projects...')"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm sm:text-xs focus:outline-none focus:border-teal-500 transition-colors resize-none"
              id="testimonial-content-textarea"
            />
          </div>

          {/* Action Button: + UPLOAD TESTIMONIAL LIVE */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isProcessingFile}
              className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
              id="upload-testimonial-live-btn"
            >
              <span>+ UPLOAD TESTIMONIAL LIVE</span>
            </button>
          </div>
        </form>
      </section>

      {/* BOTTOM SECTION: ACTIVE TESTIMONIALS List */}
      <section className="space-y-4" id="active-testimonials-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white font-['Outfit',sans-serif]">
              ACTIVE TESTIMONIALS
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-800 text-teal-300 border border-slate-700">
              {testimonials.length} Endorsements Live
            </span>
          </div>

          <div className="flex items-center gap-3">
            {testimonials.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-950/40 border border-red-800/60 hover:bg-red-900/60 text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                id="admin-delete-all-testimonials-btn"
                title="Delete all testimonials at once"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete All</span>
              </button>
            )}
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Synched to Public Homepage
            </span>
          </div>
        </div>

        {testimonials.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 space-y-2">
            <Quote className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-200">No testimonials available</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No client testimonials have been uploaded yet. Use the form above to add an endorsement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testimonials.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950 border border-slate-800/90 rounded-2xl p-6 hover:border-teal-500/40 transition-all shadow-md relative flex flex-col justify-between group"
              id={`testimonial-card-${item.id}`}
            >
              <div className="space-y-4">
                {/* Header with Avatar & Name */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <TestimonialAvatar
                      name={item.name}
                      avatar={item.avatar}
                      size="md"
                    />
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5 font-['Outfit',sans-serif]">
                        <span>{item.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                      </div>
                      <div className="text-xs text-teal-300 font-medium">
                        {item.role} {item.organization ? `• ${item.organization}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-teal-400 shrink-0">
                    {[...Array(item.rating || 5)].map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <div className="relative pl-6 italic text-xs text-slate-300 leading-relaxed font-light">
                  <Quote className="w-4 h-4 text-teal-500/30 absolute left-0 top-0 not-italic" />
                  "{item.quote}"
                </div>
              </div>

              {/* Action Buttons: [ Edit ] and [ Delete ] */}
              <div className="pt-4 mt-4 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-slate-500">
                  ID: {item.id}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                    id={`edit-testimonial-btn-${item.id}`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 hover:border-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    id={`delete-testimonial-btn-${item.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-bold text-white">Delete Client Testimonial?</h4>
              <p className="text-xs text-slate-400 mt-1">
                This client endorsement will be removed from both the Admin Console and the Public Showcase immediately.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-lg shadow-red-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Testimonial Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close edit modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 pr-10">
              <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
                EDIT TESTIMONIAL
              </span>
              <h3 className="text-xl font-bold text-white font-['Outfit',sans-serif] mt-1">
                Update Client Review
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm sm:text-xs focus:outline-none focus:border-teal-500 min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role / Company *
                </label>
                <input
                  type="text"
                  required
                  value={editRoleCompany}
                  onChange={(e) => setEditRoleCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm sm:text-xs focus:outline-none focus:border-teal-500 min-h-[42px]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Client Image (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    {editAvatar?.includes('supabase.co') && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                        Supabase CDN
                      </span>
                    )}
                    {editAvatar.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditAvatar('');
                          setEditAvatarFileName('');
                          setEditAvatarUploadStatus(null);
                          if (editFileInputRef.current) editFileInputRef.current.value = '';
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer transition-colors"
                        title="Clear image and revert to teal initial avatar"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                    <span className="text-[11px] text-teal-400 font-medium truncate max-w-[150px]">
                      {editAvatar.trim() ? (editAvatarFileName || (editAvatar.startsWith('data:') ? 'Uploaded Image' : 'Custom Image')) : 'Avatar'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={editAvatarFileName || (editAvatar.startsWith('data:') ? 'Uploaded Image' : editAvatar)}
                    onChange={(e) => {
                      setEditAvatar(e.target.value);
                      setEditAvatarFileName('');
                      setEditAvatarUploadStatus(null);
                    }}
                    placeholder="Paste Image URL or browse folder..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm sm:text-xs focus:outline-none focus:border-teal-500 truncate min-h-[42px]"
                  />

                  {/* Hidden File Input for Edit Modal */}
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditFileUpload}
                    accept="image/*"
                    className="hidden"
                    id="testimonial-edit-file-input"
                  />

                  <div className="flex items-center gap-2">
                    {/* Browse Folder Button */}
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={isProcessingFile}
                      className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 hover:border-teal-500/50 min-h-[42px]"
                      title="Upload client image to Supabase Storage"
                    >
                      {isProcessingFile ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <FolderOpen className="w-3.5 h-3.5 text-teal-400" />
                          <span>Browse</span>
                        </>
                      )}
                    </button>

                    <div className="shrink-0" title="Avatar Preview">
                      <TestimonialAvatar
                        name={editName || 'User'}
                        avatar={editAvatar}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
                {editAvatarUploadStatus && (
                  <div className="text-[11px] text-teal-300 font-mono mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>{editAvatarUploadStatus}</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  Upload from your folder or paste a URL. If empty, an avatar with initial '{getFirstNameInitial(editName)}' on teal background will be displayed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Testimonial Quote *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editQuote}
                  onChange={(e) => setEditQuote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm sm:text-xs focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingFile}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-lg shadow-teal-600/30 cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete All Testimonials Confirmation */}
      {showDeleteAllModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isDeletingAll && setShowDeleteAllModal(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-red-900/50 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
            id="delete-all-testimonials-modal"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Delete All Testimonials?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete all <strong className="text-white">{testimonials.length} testimonial(s)</strong> at once?
              </p>
              <p className="text-[11px] text-slate-500">
                This will remove all client endorsements from both your database and the public website review carousel.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={async () => {
                  setIsDeletingAll(true);
                  try {
                    const res = await deleteAllTestimonials();
                    setShowDeleteAllModal(false);
                    setStatusMessage(res.message || 'All testimonials have been deleted.');
                    setTimeout(() => setStatusMessage(null), 4000);
                  } finally {
                    setIsDeletingAll(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-red-600/30"
                id="confirm-delete-all-testimonials-btn"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting All...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete All</span>
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
