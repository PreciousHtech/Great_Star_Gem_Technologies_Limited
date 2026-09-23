import { useState, FormEvent } from 'react';
import { 
  Plus, Edit3, Trash2, ExternalLink, Code2, Globe, 
  X, Check, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ProjectItem, ServiceCategory } from '../../types';

const CATEGORY_OPTIONS: { id: ServiceCategory; name: string }[] = [
  { id: 'ict', name: 'ICT Solutions & Cloud' },
  { id: 'conference', name: 'Global Conferences' },
  { id: 'solar', name: 'Solar Power Systems' },
  { id: 'engineering', name: 'Engineering Services' },
  { id: 'real-estate', name: 'Real Estate Development' },
];

export default function ProjectsTab() {
  const { projects, addProject, updateProject, deleteProject, resetProjects } = useData();

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('e-commerce');
  const [client, setClient] = useState('');
  const [image, setImage] = useState('');
  const [summary, setSummary] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [metric1, setMetric1] = useState('');
  const [metric2, setMetric2] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Delete modal confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openNewProjectModal = () => {
    setEditingProjectId(null);
    setTitle('');
    setCategory('e-commerce');
    setClient('');
    setImage('https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80');
    setSummary('');
    setLiveUrl('');
    setGithubUrl('');
    setMetric1('High Performance');
    setMetric2('Production Ready');
    setIsModalOpen(true);
  };

  const openEditProjectModal = (proj: ProjectItem) => {
    setEditingProjectId(proj.id);
    setTitle(proj.title);
    setCategory(proj.category);
    setClient(proj.client || '');
    setImage(proj.image || '');
    setSummary(proj.summary || '');
    setLiveUrl(proj.liveUrl || '');
    setGithubUrl(proj.githubUrl || '');
    setMetric1(proj.impactMetrics?.[0] || '');
    setMetric2(proj.impactMetrics?.[1] || '');
    setIsModalOpen(true);
  };

  const handleSaveProject = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const matchedCat = CATEGORY_OPTIONS.find((c) => c.id === category);
    const categoryName = matchedCat ? matchedCat.name : 'Web Applications';
    const metrics = [metric1, metric2].filter(Boolean);

    if (editingProjectId) {
      updateProject(editingProjectId, {
        title,
        category,
        categoryName,
        client: client || 'Private Enterprise',
        image: image || 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80',
        summary,
        liveUrl,
        githubUrl,
        impactMetrics: metrics.length > 0 ? metrics : ['Verified Delivery'],
        status: 'published'
      });
      setStatusMessage(`Project "${title}" updated successfully.`);
    } else {
      addProject({
        title,
        category,
        categoryName,
        client: client || 'Enterprise Partner',
        year: new Date().getFullYear().toString(),
        location: 'Global / Multi-region',
        image: image || 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80',
        summary,
        challenge: 'Architecting scalable cloud modules and sub-second response times.',
        solution: 'Built robust modern microservices and modular UI components.',
        liveUrl,
        githubUrl,
        impactMetrics: metrics.length > 0 ? metrics : ['Production Live', '100% Verified'],
        status: 'published'
      });
      setStatusMessage(`Project "${title}" published live.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setStatusMessage(null), 3500);
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
            <span>+ Upload New Project</span>
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

                <div className="absolute top-3 right-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6">
              <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
                {editingProjectId ? 'EDIT PROJECT' : 'PUBLISH SHOWCASE'}
              </span>
              <h3 className="text-xl font-bold text-white font-['Outfit',sans-serif] mt-1">
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
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

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-lg shadow-teal-600/30 cursor-pointer"
                >
                  {editingProjectId ? 'Save Changes' : '+ Publish Project Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
