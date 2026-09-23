import { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ServiceCategory } from '../types';

export default function TestimonialsSection() {
  const { testimonials } = useData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ServiceCategory>('all');

  const filteredTestimonials = selectedFilter === 'all'
    ? testimonials
    : testimonials.filter((t) => t.serviceCategory === selectedFilter);

  const nextTestimonial = () => {
    if (filteredTestimonials.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
  };

  const prevTestimonial = () => {
    if (filteredTestimonials.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredTestimonials.length) % filteredTestimonials.length);
  };

  const activeTestimonial = filteredTestimonials[currentIndex] || filteredTestimonials[0];

  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Background radial teal accent */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[36rem] h-64 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Enduring Partnerships</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            Trusted by International Leaders & Enterprise Clients
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Hear directly from diplomats, property investors, industrial energy directors, and tech executives who rely on GreatStarGem.
          </p>
        </div>

        {/* Featured Testimonial Spotlight */}
        {activeTestimonial && (
          <div className="max-w-4xl mx-auto bg-slate-900/95 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative backdrop-blur-sm">
            <div className="absolute top-6 right-8 text-teal-500/15">
              <Quote className="w-20 h-20" />
            </div>

            <div className="relative space-y-6">
              {/* Star Rating */}
              <div className="flex items-center gap-1 text-teal-400">
                {[...Array(activeTestimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-teal-400 text-teal-400" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-lg sm:text-2xl text-slate-100 font-light leading-relaxed italic">
                "{activeTestimonial.quote}"
              </p>

              {/* Client Info */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={activeTestimonial.avatar}
                    alt={activeTestimonial.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-teal-500/40 shadow-sm"
                  />
                  <div>
                    <div className="text-base font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2">
                      <span>{activeTestimonial.name}</span>
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-xs font-medium text-teal-300">
                      {activeTestimonial.role}, {activeTestimonial.organization}
                    </div>
                    <div className="text-xs text-slate-400">
                      {activeTestimonial.country}
                    </div>
                  </div>
                </div>

                {/* Carousel Controls: Slate-button styling */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevTestimonial}
                    className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-teal-500 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    aria-label="Previous testimonial"
                    id="prev-testimonial-btn"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-mono text-slate-400 px-2">
                    {currentIndex + 1} / {filteredTestimonials.length}
                  </span>
                  <button
                    type="button"
                    onClick={nextTestimonial}
                    className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-teal-500 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    aria-label="Next testimonial"
                    id="next-testimonial-btn"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Small Testimonials Grid (Additional Evidence) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'bg-slate-900/90 border-teal-500/60 shadow-lg shadow-teal-600/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-teal-900/50'
              }`}
            >
              <div className="flex items-center gap-1 text-teal-400 mb-3">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                "{item.quote}"
              </p>
              <div className="flex items-center gap-2.5 pt-3 border-t border-slate-800/80">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">{item.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{item.organization}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Credibility Counters */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-extrabold text-white font-['Outfit',sans-serif]">100%</div>
            <div className="text-xs text-slate-400 mt-1">Contractual Delivery Rate</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-['Outfit',sans-serif]">25+</div>
            <div className="text-xs text-slate-400 mt-1">Partner Nations & Consulates</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-['Outfit',sans-serif]">40+ MW</div>
            <div className="text-xs text-slate-400 mt-1">Clean Solar Photovoltaics</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-['Outfit',sans-serif]">Tier-3</div>
            <div className="text-xs text-slate-400 mt-1">Enterprise ICT Architecture</div>
          </div>
        </div>

      </div>
    </section>
  );
}
