import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { 
  Plus, Edit3, Trash2, ExternalLink, Code2, X, Check, AlertCircle, RefreshCw, Layers, Video, FolderOpen, Play, Cloud, Sparkles, Loader2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ProjectItem, ServiceCategory } from '../../types';
import ProjectVideoPlayer from '../ProjectVideoPlayer';
import { uploadFileToSupabaseStorage, validateFileSize, MAX_MEDIA_SIZE_MB } from '../../utils/storageClient';
import FileSizeAlertModal, { FileSizeAlertDetails } from './FileSizeAlertModal';

const CATEGORY_OPTIONS: { id: ServiceCategory; name: string }[] = [
  { id: 'web-application', name: 'Web Application' },
  { id: 'ict', name: 'ICT Solutions & Cloud' },
  { id: 'conference', name: 'Global Conferences' },
  { id: 'solar', name: 'Solar Power Systems' },
  { id: 'engineering', name: 'Engineering Services' },
  { id: 'real-estate', name: 'Real Estate Development' },
];

export default function ProjectsTab() {
  const { projects, addProject, updateProject, deleteProject, deleteAllProjects, resetProjects } = useData();

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('web-application');
  const [client, setClient] = useState('');
  const [image, setImage] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState<string | null>(null);
  const [imageStorageType, setImageStorageType] = useState<'supabase' | 'external' | 'local' | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Video states
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState<string | null>(null);
  const [videoStorageType, setVideoStorageType] = useState<'supabase' | 'external' | 'local' | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // File size limit modal alert state
  const [sizeAlertDetails, setSizeAlertDetails] = useState<FileSizeAlertDetails | null>(null);

  const [summary, setSummary] = useState('');
  const [challenge, setChallenge] = useState('');
  const [solution, setSolution] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [metric1, setMetric1] = useState('');
  const [metric2, setMetric2] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Delete modal confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleImageFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);

    // Validate 50MB file limit
    const sizeValidation = validateFileSize(file, MAX_MEDIA_SIZE_MB);
    if (!sizeValidation.valid) {
      setImageError(sizeValidation.error || `Image exceeds ${MAX_MEDIA_SIZE_MB}MB limit.`);
      setSizeAlertDetails({
        fileName: file.name,
        fileSizeBytes: file.size,
        fileType: 'image',
        actionContext: 'Project Cover Image'
      });
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (JPEG, PNG, WebP, etc.).');
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
      return;
    }

    setIsProcessingImage(true);
    setImageFileName(file.name);
    setImageUploadStatus('Uploading image to Supabase Storage bucket...');

    // Attempt direct Supabase Storage bucket upload
    const uploadRes = await uploadFileToSupabaseStorage(file, 'Cover_image', (msg) => {
      setImageUploadStatus(msg);
    });

    if (uploadRes.success && uploadRes.url) {
      // Direct public CDN URL returned from Supabase bucket!
      setImage(uploadRes.url);
      setImageStorageType('supabase');
      setImageUploadStatus('✓ Uploaded to Supabase Storage CDN.');
      setIsProcessingImage(false);
      return;
    }

    // Graceful fallback to data URL if Supabase Storage API key is pending
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setImage(data);
      setImageStorageType('local');
      setImageUploadStatus(uploadRes.requiresKey 
        ? 'Using local preview (Add Supabase API Key in Database tab for Cloud CDN)' 
        : 'Image attached');
      setIsProcessingImage(false);
    };
    reader.onerror = () => {
      setIsProcessingImage(false);
      setImageFileName('');
      setImageUploadStatus(null);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoError(null);

    // Validate 50MB file limit
    const sizeValidation = validateFileSize(file, MAX_MEDIA_SIZE_MB);
    if (!sizeValidation.valid) {
      setVideoError(sizeValidation.error || `Video file exceeds ${MAX_MEDIA_SIZE_MB}MB.`);
      setSizeAlertDetails({
        fileName: file.name,
        fileSizeBytes: file.size,
        fileType: 'video',
        actionContext: 'Proof of Work Video Demonstration'
      });
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
      return;
    }

    setIsProcessingVideo(true);
    setVideoFileName(file.name);
    setVideoUploadStatus('Uploading video to Supabase Storage bucket...');

    // Attempt direct Supabase Storage bucket upload
    const uploadRes = await uploadFileToSupabaseStorage(file, 'Videos', (msg) => {
      setVideoUploadStatus(msg);
    });

    if (uploadRes.success && uploadRes.url) {
      // Direct public CDN URL returned from Supabase bucket!
      // This URL string is saved directly as a text field in Postgres via Prisma.
      setVideoUrl(uploadRes.url);
      setVideoStorageType('supabase');
      setVideoUploadStatus('✓ Uploaded to Supabase Storage bucket (CDN). Ready to publish.');
      setIsProcessingVideo(false);
      return;
    }

    // If Supabase API key is pending or needs configuration, fall back gracefully
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setVideoUrl(data);
      setVideoStorageType('local');
      setVideoUploadStatus(uploadRes.requiresKey 
        ? 'Local preview active (Connect Supabase API Key in Database tab to stream via Supabase CDN)'
        : 'Video attached');
      setIsProcessingVideo(false);
    };
    reader.onerror = () => {
      setIsProcessingVideo(false);
      setVideoFileName('');
      setVideoUploadStatus(null);
      setVideoError('Failed to read video file from local storage.');
    };
    reader.readAsDataURL(file);
  };

  const openNewProjectModal = () => {
    setEditingProjectId(null);
    setTitle('');
    setCategory('web-application');
    setClient('');
    setImage('/GreatStarGem_Logo.png'); // If no cover image, This image URL is used as the cover image for the project
    setImageFileName('');
    setImageUploadStatus(null);
    setImageStorageType(null);
    setVideoUrl('');
    setVideoFileName('');
    setVideoUploadStatus(null);
    setVideoStorageType(null);
    setVideoError(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    setSummary('');
    setChallenge('');
    setSolution('');
    setLiveUrl('');
    setGithubUrl('');
    setMetric1('99.99% Cloud SLA');
    setMetric2('Enterprise Ready');
    setIsModalOpen(true);
  };

  const openEditProjectModal = (proj: ProjectItem) => {
    setEditingProjectId(proj.id);
    setTitle(proj.title);
    setCategory(proj.category);
    setClient(proj.client || '');
    setImage(proj.image || '');
    setImageFileName(proj.image?.startsWith('data:') ? 'Uploaded image' : '');
    setImageStorageType(proj.image?.includes('supabase.co') ? 'supabase' : null);
    setImageUploadStatus(proj.image?.includes('supabase.co') ? '✓ Stored in Supabase Storage CDN' : null);
    setVideoUrl(proj.videoUrl || '');
    setVideoFileName(proj.videoUrl?.startsWith('data:') ? 'Uploaded video clip' : '');
    setVideoStorageType(proj.videoUrl?.includes('supabase.co') ? 'supabase' : null);
    setVideoUploadStatus(proj.videoUrl?.includes('supabase.co') ? '✓ Stored in Supabase Storage CDN' : null);
    setVideoError(null);
    setSummary(proj.summary || '');
    setChallenge(proj.challenge || '');
    setSolution(proj.solution || '');
    setLiveUrl(proj.liveUrl || '');
    setGithubUrl(proj.githubUrl || '');
    setMetric1(proj.impactMetrics?.[0] || '');
    setMetric2(proj.impactMetrics?.[1] || '');
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    setIsSaving(true);
    try {
      const matchedCat = CATEGORY_OPTIONS.find((c) => c.id === category);
      const categoryName = matchedCat ? matchedCat.name : 'Web Applications';
      const metrics = [metric1, metric2].filter(Boolean);

      if (editingProjectId) {
        await updateProject(editingProjectId, {
          title,
          category,
          categoryName,
          client: client || 'Private Enterprise',
          image: image || 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80',
          videoUrl: videoUrl.trim(),
          summary,
          challenge: challenge.trim() || ' ',
          solution: solution.trim() || ' ',
          liveUrl,
          githubUrl,
          impactMetrics: metrics.length > 0 ? metrics : ['Verified Delivery'],
          status: 'published'
        });
        setStatusMessage(`Project "${title}" updated and saved to database.`);
      } else {
        await addProject({
          title,
          category,
          categoryName,
          client: client || 'Enterprise Partner',
          year: new Date().getFullYear().toString(),
          location: 'Global / Multi-region',
          image: image || 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80',
          videoUrl: videoUrl.trim(),
          summary,
          challenge: challenge.trim() || "No Input",
          solution: solution.trim() || "No Input",
          liveUrl,
          githubUrl,
          impactMetrics: metrics.length > 0 ? metrics : ['Production Live', '100% Verified'],
          status: 'published'
        });
        setStatusMessage(`Project "${title}" published and saved to database.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Error saving project:', err);
      setStatusMessage('Warning: Encountered an issue while saving project.');
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setDeleteConfirmId(null);
    setStatusMessage('Project permanently removed from active showcase.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Top Action & Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-['Outfit',sans-serif]">
              Developer Portfolio Projects
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {projects.length} Published
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage showcase developer projects, web applications, and enterprise builds visible on the public website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-950/40 border border-red-800/60 hover:bg-red-900/60 text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              id="admin-delete-all-projects-btn"
              title="Delete all projects at once"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete All</span>
            </button>
          )}

          <button
            type="button"
            onClick={resetProjects}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset to default seeded projects"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={openNewProjectModal}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-lg shadow-teal-600/30 transition-all flex items-center gap-2 cursor-pointer"
            id="admin-add-project-btn"
          >
            <Plus className="w-4 h-4" />
            <span> Upload New Project</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center gap-2.5 text-xs text-teal-200 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid List of Active Published Projects */}
      {projects.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No project available</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No projects have been uploaded yet. Click "+ Upload New Project" above to create and publish a project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
          <div
            key={project.id}
            className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500/40 transition-all flex flex-col justify-between group shadow-lg"
            id={`admin-project-card-${project.id}`}
          >
            <div>
              {/* Image & Badge */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-slate-950/90 text-teal-300 border border-teal-500/30 text-[11px] font-semibold">
                    {project.categoryName || project.category}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {project.videoUrl && project.videoUrl.trim() && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1 shadow-sm">
                      <Video className="w-3 h-3 text-teal-400" />
                      <span>Video</span>
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3">
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Client: {project.client}</span>
                  <span>{project.year || '2025'}</span>
                </div>

                <h3 className="text-base font-bold text-white font-['Outfit',sans-serif] line-clamp-1">
                  {project.title}
                </h3>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {project.summary}
                </p>

                {/* Metrics Pill tags */}
                {project.impactMetrics && project.impactMetrics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.impactMetrics.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded border border-teal-500/20"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card Action Buttons: Edit & Delete */}
            <div className="p-5 pt-0 border-t border-slate-900/80 mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Live Demo"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Source Repository"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditProjectModal(project)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                  id={`admin-edit-project-${project.id}`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(project.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 hover:border-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  id={`admin-delete-project-${project.id}`}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-bold text-white">Delete Portfolio Project?</h4>
              <p className="text-xs text-slate-400 mt-1">
                This project will be permanently unmounted from both the Admin Console and the Public Showcase.
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

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 pr-10">
              <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
                {editingProjectId ? 'EDIT PROJECT' : 'PUBLISH SHOWCASE'}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit',sans-serif] mt-1">
                {editingProjectId ? 'Modify Project Details' : 'Upload New Developer Showcase Project'}
              </h3>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Project Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client / Organization
                  </label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g., Technoville / RSU"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <span>Project Cover Image *</span>
                      <span className="text-[10px] font-mono text-amber-400/90 font-normal">(Max 50MB)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {imageStorageType === 'supabase' || image?.includes('supabase.co') ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                          <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                          Supabase CDN
                        </span>
                      ) : null}
                      {image && (
                        <button
                          type="button"
                          onClick={() => {
                            setImage('');
                            setImageFileName('');
                            setImageUploadStatus(null);
                            setImageStorageType(null);
                            if (imageFileInputRef.current) imageFileInputRef.current.value = '';
                          }}
                          className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={imageFileName || (image.startsWith('data:') ? 'Uploaded from folder' : image)}
                      onChange={(e) => {
                        setImage(e.target.value);
                        setImageFileName('');
                        setImageStorageType(null);
                        setImageUploadStatus(null);
                      }}
                      placeholder="Paste image URL or browse folder..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm sm:text-xs focus:outline-none focus:border-teal-500 truncate min-h-[42px]"
                    />
                    <input
                      type="file"
                      ref={imageFileInputRef}
                      onChange={handleImageFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageFileInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 min-h-[42px]"
                      title="Browse image from folder (Max 5MB)"
                    >
                      {isProcessingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <FolderOpen className="w-3.5 h-3.5 text-teal-400" />
                          <span>Browse Image</span>
                        </>
                      )}
                    </button>
                  </div>
                  {imageError && (
                    <div className="mt-2 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{imageError}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setImageError(null)} 
                        className="text-red-400 hover:text-white"
                        aria-label="Dismiss error"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {imageUploadStatus && !imageError && (
                    <div className="text-[11px] text-teal-300/90 font-mono mt-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
                      <span>{imageUploadStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof of Work Video (Short Video or URL) & Live Preview */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-teal-500/30 space-y-3.5 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
                      <Video className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                        <span>Proof of Work Video (Video Upload or Link)</span>
                        <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Max 50MB
                        </span>
                        {videoStorageType === 'supabase' || videoUrl?.includes('supabase.co') ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                            Supabase Storage Bucket URL
                          </span>
                        ) : null}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {videoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setVideoUrl('');
                          setVideoFileName('');
                          setVideoError(null);
                          setVideoUploadStatus(null);
                          setVideoStorageType(null);
                          if (videoFileInputRef.current) videoFileInputRef.current.value = '';
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer"
                        title="Remove video"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                    <span className="text-[11px] text-teal-400 font-semibold truncate max-w-[150px]">
                      {videoFileName || (videoUrl ? 'Video Attached' : 'Optional')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a short video demonstration from your device or paste a video link (MP4, YouTube, Vimeo, Loom). When uploaded, the video is saved to your Supabase Storage bucket and its public CDN URL is saved directly into PostgreSQL via Prisma.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={videoFileName || (videoUrl.startsWith('data:') ? 'Uploaded video clip' : videoUrl)}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setVideoFileName('');
                      setVideoError(null);
                      setVideoStorageType(null);
                      setVideoUploadStatus(null);
                    }}
                    placeholder="Paste video URL (YouTube, Vimeo, Loom, MP4) or browse folder..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm sm:text-xs focus:outline-none focus:border-teal-500 truncate min-h-[42px]"
                  />

                  <input
                    type="file"
                    ref={videoFileInputRef}
                    onChange={handleVideoFileUpload}
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={isProcessingVideo}
                    className="px-3.5 py-2.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 min-h-[42px]"
                    title="Upload short video demonstration from local folder"
                  >
                    {isProcessingVideo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="w-3.5 h-3.5 text-teal-400" />
                        <span>Browse Video</span>
                      </>
                    )}
                  </button>
                </div>

                {videoUploadStatus && (
                  <div className="text-[11px] text-teal-300 font-mono flex items-center gap-1.5 pt-1">
                    <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>{videoUploadStatus}</span>
                  </div>
                )}

                {videoError && (
                  <div className="mt-2 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{videoError}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setVideoError(null)} 
                      className="text-red-400 hover:text-white"
                      aria-label="Dismiss error"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Live Interactive Video Preview inside Admin */}
                {videoUrl && videoUrl.trim() && (
                  <div className="pt-2 border-t border-slate-900/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-teal-400 fill-teal-400" />
                        <span>Interactive Proof of Work Preview (Public Website View):</span>
                      </span>
                      <span className="text-[10px] text-teal-400 font-mono">
                        {videoFileName ? `File: ${videoFileName}` : 'External Embed'}
                      </span>
                    </div>

                    <div className="max-w-md mx-auto">
                      <ProjectVideoPlayer
                        videoUrl={videoUrl}
                        posterImage={image}
                        title={title || 'Proof of Work Preview'}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Description / Summary *
                </label>
                <textarea
                  required
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe technical architecture, modules implemented, deliverables, and performance results..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              {/* The Engineering Challenge & The GreatStarGem Solution (Admin editable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-red-400 uppercase tracking-wider">
                      The Engineering Challenge
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Modal Field</span>
                  </div>
                  <textarea
                    rows={3}
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    placeholder="Type the specific technical problem, obstacle, or architectural bottleneck faced in this project..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-red-500/70 resize-none transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Displayed in the project detail modal under "THE ENGINEERING CHALLENGE".
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      The GreatStarGem Solution
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Modal Field</span>
                  </div>
                  <textarea
                    rows={3}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Type the Great Star Gem Technologies technical solution, engineering strategy, and deliverables implemented..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/70 resize-none transition-colors"
                  />
                    
                  <p className="text-[10px] text-slate-500 mt-1">
                    Displayed in the project detail modal under "THE GREATSTARGEM SOLUTION".
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Impact Metric 1 (Optional)
                  </label>
                  <input
                    type="text"
                    value={metric1}
                    onChange={(e) => setMetric1(e.target.value)}
                    placeholder="e.g., 99.99% Uptime"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Impact Metric 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={metric2}
                    onChange={(e) => setMetric2(e.target.value)}
                    placeholder="e.g., Sub-400ms Latency"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Live Demo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://example-demo.app"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    GitHub Repo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isProcessingVideo || isProcessingImage}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-lg shadow-teal-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>{editingProjectId ? 'Save Changes' : '+ Publish Project Live'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete All Projects Confirmation */}
      {showDeleteAllModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isDeletingAll && setShowDeleteAllModal(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-red-900/50 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
            id="delete-all-projects-modal"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Delete All Projects?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete all <strong className="text-white">{projects.length} project(s)</strong> at once?
              </p>
              <p className="text-[11px] text-slate-500">
                This will remove all published projects from both your database and the public website showcase.
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
                    const res = await deleteAllProjects();
                    setShowDeleteAllModal(false);
                    setStatusMessage(res.message || 'All projects have been deleted.');
                    setTimeout(() => setStatusMessage(null), 4000);
                  } finally {
                    setIsDeletingAll(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-red-600/30"
                id="confirm-delete-all-projects-btn"
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

      {/* File Size Limit Alert Modal */}
      <FileSizeAlertModal
        details={sizeAlertDetails}
        onClose={() => setSizeAlertDetails(null)}
      />
    </div>
  );
}
