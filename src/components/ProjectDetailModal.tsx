import { X, MapPin, Calendar, Building, CheckCircle2, ArrowRight, Video, AlertTriangle, Sparkles } from 'lucide-react';
import { ProjectItem } from '../types';
import ProjectVideoPlayer from './ProjectVideoPlayer';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onInquire: (serviceId: string) => void;
}

export default function ProjectDetailModal({ project, onClose, onInquire }: ProjectDetailModalProps) {
  if (!project) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Image Header */}
        <div className="relative h-44 sm:h-64 md:h-72 w-full shrink-0">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white border border-slate-700 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg"
            aria-label="Close project modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-6 right-4 sm:right-6">
            <span className="px-3 py-1 rounded-full bg-teal-500/25 text-teal-300 border border-teal-500/40 text-[11px] sm:text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              {project.categoryName || project.category}
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-1.5 sm:mt-2 leading-tight">
              {project.title}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300 min-w-0">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="truncate">{project.location || 'Global / Multi-region'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{project.year || '2025'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 min-w-0">
              <Building className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="truncate">{project.client || 'Enterprise Partner'}</span>
            </div>
          </div>

          {/* Proof of Work Video Demonstration */}
          {project.videoUrl && project.videoUrl.trim() && (
            <div className="space-y-3 p-3.5 sm:p-5 rounded-2xl bg-slate-950/80 border border-teal-500/30 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-1.5">
                      <span>Proof of Work Video Demonstration</span>
                      <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        Verified Delivery
                      </span>
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Authentic recorded proof of project execution and delivery for client trust.
                    </p>
                  </div>
                </div>
              </div>

              <ProjectVideoPlayer
                videoUrl={project.videoUrl}
                posterImage={project.image}
                title={`${project.title} - Proof of Work`}
              />
            </div>
          )}

          {/* Project Summary */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-400 mb-2 font-mono">
              PROJECT SUMMARY & ARCHITECTURE
            </h4>
            <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-line">
              {project.summary}
            </p>
          </div>

          {/* THE ENGINEERING CHALLENGE & THE GREATSTARGEM SOLUTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-red-500/30 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <h5 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-400">
                  The Engineering Challenge
                </h5>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {project.challenge || 'Architecting scalable cloud modules, distributed database latency constraints, and rigorous mission-critical infrastructure tolerances.'}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h5 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400">
                  The GreatStarGem Solution
                </h5>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {project.solution || 'Designed and deployed turnkey engineering architecture, automated microservices, and modular UI components with measurable operational impact.'}
              </p>
            </div>
          </div>

          {/* Key Impact Metrics */}
          {project.impactMetrics && project.impactMetrics.length > 0 && (
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-400 mb-3 font-mono">
                VERIFIED OUTCOMES & METRICS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {project.impactMetrics.map((metric, i) => (
                  <div key={i} className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-center">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                    <div className="text-xs sm:text-sm font-bold text-white font-['Outfit',sans-serif]">
                      {metric}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-5 bg-slate-950 border-t border-slate-800 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer min-h-[44px]"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onInquire(project.category);
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/30 transition-all cursor-pointer min-h-[44px]"
          >
            <span className="truncate">Inquire Similar Project</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
