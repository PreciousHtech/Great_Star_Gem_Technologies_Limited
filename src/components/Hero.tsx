import { ArrowRight, Globe, ShieldCheck, CheckCircle2, Award } from 'lucide-react';
import { COMPANY_STATS } from '../data/content';

interface HeroProps {
  onSelectServiceTab?: (serviceId: string) => void;
}

export default function Hero({ onSelectServiceTab }: HeroProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Background Ambience & Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Multidisciplinary Conglomerate of Choice</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-['Outfit',sans-serif] leading-[1.14]">
            Building Infrastructure. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500">
              Powering Energy.
            </span> <br />
            Connecting Global Frontiers.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            <strong className="text-white font-semibold">GreatStarGem</strong> delivers turnkey excellence across five critical economic pillars: world-class international conferences, eco-resilient real estate, commercial solar PV power, multidisciplinary engineering, and enterprise ICT solutions.
          </p>

          {/* CTAs: Purple-button & Slate-button */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => scrollToSection('services')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-600/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              id="hero-cta-services"
            >
              <span>Explore Our Services</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 font-semibold text-sm sm:text-base shadow-sm transition-all duration-200 cursor-pointer"
              id="hero-cta-consultation"
            >
              <span>Request Project Proposal</span>
            </button>
          </div>

          {/* Quick Guarantees */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ISO & Regulatory Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Turnkey EPC Execution</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-slate-300" />
              <span>Global & Local Compliance</span>
            </div>
          </div>
        </div>

        {/* Highlight Stats Strip */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 text-left">
          {COMPANY_STATS.map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
                {stat.value}
              </span>
              <span className="text-sm font-semibold text-purple-400 mt-1">
                {stat.label}
              </span>
              <span className="text-xs text-slate-400 mt-0.5">
                {stat.subtext}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
