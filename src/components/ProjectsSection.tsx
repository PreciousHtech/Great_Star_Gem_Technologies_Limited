import { useState } from 'react';
import { ArrowRight, MapPin, Calendar, ExternalLink, Layers, Play, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ProjectItem, ServiceCategory } from '../types';

interface ProjectsSectionProps {
  onOpenProjectModal: (project: ProjectItem) => void;
}

const PROJECTS_PER_PAGE = 6;

export default function ProjectsSection({ onOpenProjectModal }: ProjectsSectionProps) {
  const { projects } = useData();
  const [activeFilter, setActiveFilter] = useState<'all' | ServiceCategory>('all');
  const [currentPage, setCurrentPage] = useState<number>(0);

  const filterTabs: { id: 'all' | ServiceCategory; label: string }[] = [
    { id: 'all', label: 'All Portfolios' },
    { id: 'web-application', label: 'Web Applications' },
    { id: 'conference', label: 'Global Conferences' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'solar', label: 'Solar Power' },
    { id: 'engineering', label: 'Engineering' },
    { id: 'ict', label: 'ICT Solutions' },
  ];

  const filteredProjects = activeFilter === 'all'
    ? projects
    : projects.filter((p) => 
        p.category === activeFilter || 
        (activeFilter === 'web-application' && (p.category === 'web-application'))
      );

  const totalProjects = filteredProjects.length;
  const totalPages = Math.ceil(totalProjects / PROJECTS_PER_PAGE);
  const safePage = totalPages > 0 ? currentPage % totalPages : 0;
  const startIndex = safePage * PROJECTS_PER_PAGE;
  const endIndex = Math.min(startIndex + PROJECTS_PER_PAGE, totalProjects);
  const displayedProjects = totalProjects > PROJECTS_PER_PAGE
    ? filteredProjects.slice(startIndex, endIndex)
    : filteredProjects;

  const isLastPage = totalPages > 1 && safePage === totalPages - 1;

  const handleFilterChange = (filterId: 'all' | ServiceCategory) => {
    setActiveFilter(filterId);
    setCurrentPage(0);
  };

  const handleCycleNext = () => {
    if (totalPages <= 1) return;
    const nextPageIndex = (safePage + 1) % totalPages;
    setCurrentPage(nextPageIndex);

    // Smoothly scroll viewer to top of the projects grid
    const gridTop = document.getElementById('projects-grid-top');
    if (gridTop) {
      gridTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="projects" className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
      {/* Subtle Teal Accent Glow */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <span>Proven Milestones</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
              Featured Projects & Portfolio
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-300">
              A track record of developer showcase projects, high-stakes summits, modern residential master-plans, multi-megawatt solar arrays, and high-security enterprise systems.
            </p>
          </div>

          {projects.length > 0 && (
            <div className="text-xs sm:text-sm text-slate-400 font-mono">
              {totalPages > 1 ? (
                <span>
                  Showing <strong className="text-teal-300 font-semibold">{startIndex + 1}–{endIndex}</strong> of {totalProjects} Projects (Set {safePage + 1} of {totalPages})
                </span>
              ) : (
                <span>Showing {filteredProjects.length} of {projects.length} Featured Case Studies</span>
              )}
            </div>
          )}
        </div>

        {/* If no projects exist */}
        {projects.length === 0 ? (
          <div className="py-16 sm:py-20 px-4 sm:px-6 text-center rounded-2xl sm:rounded-3xl bg-slate-950/60 border border-dashed border-slate-800 max-w-xl mx-auto space-y-3">
            <Layers className="w-10 sm:w-12 h-10 sm:h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit',sans-serif]">
              No project available
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Our administrative engineering team has not uploaded any projects yet. Please check back soon or contact us directly.
            </p>
          </div>
        ) : (
          <>
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleFilterChange(tab.id)}
                    className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center shrink-0 ${
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

            {/* Scroll Anchor for smooth cycling */}
            <div id="projects-grid-top" className="scroll-mt-28" />

            {filteredProjects.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-mono text-sm bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl max-w-md mx-auto">
                No project available
              </div>
            ) : (
              <>
                {/* Project Cards Grid (Max 6 shown at a time) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {displayedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500/40 transition-all duration-300 flex flex-col group"
                      id={`project-card-${project.id}`}
                    >
                      {/* Image with hover zoom */}
                      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                        
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full bg-slate-900/90 text-teal-300 border border-teal-500/30 text-[11px] sm:text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
                            {project.categoryName || project.category}
                          </span>
                        </div>

                        {/* Proof of Work Video Badge if available */}
                        {project.videoUrl && project.videoUrl.trim() && (
                          <div className="absolute top-4 right-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenProjectModal(project);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/90 hover:bg-teal-400 text-white text-[11px] sm:text-xs font-bold tracking-wide shadow-lg shadow-teal-500/30 backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer min-h-[36px]"
                              title="Watch Proof of Work Video"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Proof of Work</span>
                            </button>
                          </div>
                        )}

                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span className="truncate">{project.location || 'Global'}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span>{project.year || '2025'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit',sans-serif] group-hover:text-teal-400 transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-xs text-slate-400">
                            Client: <strong className="text-slate-300 font-medium">{project.client}</strong>
                          </p>
                          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                            {project.summary}
                          </p>

                          {/* Impact highlights */}
                          <div className="pt-2 flex flex-wrap gap-1.5">
                            {project.impactMetrics && project.impactMetrics.slice(0, 2).map((m, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-md bg-teal-950/40 border border-teal-800/40 text-[11px] font-semibold text-teal-300">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-2">
                          {project.videoUrl && project.videoUrl.trim() && (
                            <button
                              type="button"
                              onClick={() => onOpenProjectModal(project)}
                              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-teal-600/25 min-h-[44px]"
                              id={`watch-video-${project.id}`}
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>Watch Proof Video</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenProjectModal(project)}
                            className={`${project.videoUrl && project.videoUrl.trim() ? 'w-full sm:w-auto px-4' : 'w-full'} flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm min-h-[44px]`}
                            id={`view-case-study-${project.id}`}
                          >
                            <span>{project.videoUrl && project.videoUrl.trim() ? 'Details' : 'Inspect Case Study'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Circular Pagination Button (Displays when total projects > 6) */}
                {totalPages > 1 && (
                  <div className="mt-10 sm:mt-12 flex flex-col items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleCycleNext}
                      className={`group inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer shadow-lg active:scale-95 min-h-[48px] ${
                        isLastPage
                          ? 'bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 hover:from-teal-400 hover:to-teal-600 text-white shadow-teal-500/25 border border-teal-400/40 hover:shadow-teal-400/30'
                          : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-teal-600/30 border border-teal-500/30 hover:shadow-teal-500/40'
                      }`}
                      id="cycle-projects-btn"
                    >
                      <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isLastPage ? 'group-hover:-rotate-180 text-teal-200' : 'group-hover:rotate-180'}`} />
                      <span>
                        {isLastPage
                          ? `Cycle Back to Start (Projects 1–${Math.min(PROJECTS_PER_PAGE, totalProjects)})`
                          : `Load Next 6 Projects (${endIndex + 1}–${Math.min(endIndex + PROJECTS_PER_PAGE, totalProjects)})`}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* Pagination indicators / dots */}
                    <div className="flex items-center gap-2 pt-1">
                      {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCurrentPage(idx);
                            const gridTop = document.getElementById('projects-grid-top');
                            if (gridTop) gridTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                            idx === safePage
                              ? 'w-7 bg-teal-400 shadow-sm shadow-teal-400/50'
                              : 'w-2 bg-slate-700 hover:bg-slate-500'
                          }`}
                          title={`Jump to projects set ${idx + 1}`}
                          aria-label={`Jump to projects set ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-slate-400 font-mono">
                      Set {safePage + 1} of {totalPages} • Total {totalProjects} Projects Available
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Global Delivery Banner */}
        <div className="mt-12 sm:mt-16 p-5 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-bold text-white font-['Outfit',sans-serif]">
              Have a high-scale project or conference in mind?
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              Our multidisciplinary engineering and planning directors review architectural and EPC briefs within 24 hours.
            </p>
          </div>
          <a
            href="#contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-sm shadow-md shadow-teal-600/25 whitespace-nowrap transition-colors cursor-pointer min-h-[48px]"
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
