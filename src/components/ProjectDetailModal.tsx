import { X, MapPin, Calendar, Building, CheckCircle2, ArrowRight } from 'lucide-react';
import { ProjectItem } from '../types';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onInquire: (serviceId: string) => void;
}

export default function ProjectDetailModal({ project, onClose, onInquire }: ProjectDetailModalProps) {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Image Header */}
        <div className="relative h-60 sm:h-72 w-full">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white border border-slate-700 transition-colors cursor-pointer"
            aria-label="Close project modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-semibold uppercase tracking-wider">
              {project.categoryName}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-2">
              {project.title}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Metadata Row */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="truncate">{project.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{project.year}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Building className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="truncate">{project.client}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-teal-400 mb-2">
              Project Summary
            </h4>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {project.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h5 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1.5">
                The Engineering Challenge
              </h5>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {project.challenge}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
                The GreatStarGem Solution
              </h5>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {project.solution}
              </p>
            </div>
          </div>

          {/* Key Impact Metrics */}
          {project.impactMetrics && project.impactMetrics.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-purple-400 mb-3">
                Verified Project Outcomes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {project.impactMetrics.map((metric, i) => (
                  <div key={i} className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-center">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                    <div className="text-sm font-bold text-white font-['Outfit',sans-serif]">
                      {metric}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Slate-button & Purple-button */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onInquire(project.category);
              onClose();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition-all cursor-pointer"
          >
            <span>Inquire Similar Project</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
