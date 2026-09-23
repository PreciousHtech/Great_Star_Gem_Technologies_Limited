import { useState } from 'react';
import { ArrowRight, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ProjectItem, ServiceCategory } from '../types';

interface ProjectsSectionProps {
  onOpenProjectModal: (project: ProjectItem) => void;
}

export default function ProjectsSection({ onOpenProjectModal }: ProjectsSectionProps) {
  const { projects } = useData();
  const [activeFilter, setActiveFilter] = useState<'all' | ServiceCategory>('all');

  const filterTabs: { id: 'all' | ServiceCategory; label: string }[] = [
    { id: 'all', label: 'All Portfolios' },
    { id: 'conference', label: 'Global Conferences' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'solar', label: 'Solar Power' },
    { id: 'engineering', label: 'Engineering' },
    { id: 'ict', label: 'ICT Solutions' },
  ];

  const filteredProjects = activeFilter === 'all'
    ? projects
    : projects.filter((p) => p.category === activeFilter);

  return (
    <section id="projects" className="py-24 sm:py-32 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
      {/* Subtle Teal Accent Glow */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <span>Proven Milestones</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
              Featured Projects & Portfolio
            </h2>
            <p className="mt-4 text-base text-slate-300">
              A track record of developer showcase projects, high-stakes summits, modern residential master-plans, multi-megawatt solar arrays, and high-security enterprise systems.
            </p>
          </div>

          <div className="text-sm text-slate-400 font-mono">
            Showing {filteredProjects.length} of {projects.length} Featured Case Studies
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-600/25'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
                id={`project-filter-${tab.id}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500/40 transition-all duration-300 flex flex-col group"
              id={`project-card-${project.id}`}
            >
              {/* Image with hover zoom */}
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-slate-900/90 text-teal-300 border border-teal-500/30 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
                    {project.categoryName || project.category}
                  </span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span className="truncate">{project.location || 'Global'}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>{project.year || '2025'}</span>
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-white font-['Outfit',sans-serif] group-hover:text-teal-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Client: <strong className="text-slate-300 font-medium">{project.client}</strong>
                  </p>
                  <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {project.summary}
                  </p>

                  {/* Impact highlights */}
                  <div className="pt-3 flex flex-wrap gap-1.5">
                    {project.impactMetrics && project.impactMetrics.slice(0, 2).map((m, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-teal-950/40 border border-teal-800/40 text-[11px] font-semibold text-teal-300">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onOpenProjectModal(project)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-gradient-to-r hover:from-teal-600 hover:to-teal-700 text-slate-200 hover:text-white border border-slate-700 hover:border-transparent text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm"
                    id={`view-case-study-${project.id}`}
                  >
                    <span>Inspect Case Study</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Delivery Banner */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
              Have a high-scale project or conference in mind?
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              Our multidisciplinary engineering and planning directors review architectural and EPC briefs within 24 hours.
            </p>
          </div>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-sm shadow-md shadow-teal-600/25 whitespace-nowrap transition-colors cursor-pointer"
            id="projects-cta-btn"
          >
            <span>Submit Project RFQ</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
