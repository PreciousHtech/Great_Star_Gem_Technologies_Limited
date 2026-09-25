import { useState } from 'react';
import { Target, Compass, Network, Award, ShieldCheck, Users, CheckCircle } from 'lucide-react';
import { CORE_VALUES } from '../data/content';

export default function AboutSection() {
  const [activeTab, setActiveTab] = useState<'vision' | 'reach' | 'synergy'>('vision');

  return (
    <section id="about" className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-teal-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>About GreatStarGem</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight leading-tight">
            A Multidisciplinary Conglomerate Built on Rigor & Global Vision
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-slate-300 leading-relaxed">
            Established to bridge structural infrastructure, renewable energy independence, and digital transformation, 
            <strong className="text-white font-semibold"> GreatStarGem</strong> unites international event architects, civil engineers, renewable energy pioneers, real estate developers, and ICT systems consultants under one unified standard of excellence.
          </p>
        </div>

        {/* Interactive Pillar Tabs */}
        <div className="mt-8 sm:mt-12 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-8 backdrop-blur-sm shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 border-b border-slate-800 pb-5">
            <button
              type="button"
              onClick={() => setActiveTab('vision')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'vision'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-600/25'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/80'
              }`}
              id="about-tab-vision"
            >
              <Target className="w-4 h-4 shrink-0" />
              <span>Vision & Mission</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reach')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'reach'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-600/25'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/80'
              }`}
              id="about-tab-reach"
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Global & Local Reach</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('synergy')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'synergy'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-600/25'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/80'
              }`}
              id="about-tab-synergy"
            >
              <Network className="w-4 h-4 shrink-0" />
              <span>Multi-Sector Synergy</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="pt-6">
            {activeTab === 'vision' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white font-['Outfit',sans-serif]">
                    Driving Sustainable Infrastructure and Global Dialogue
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Our mission is to empower developing and mature markets with critical infrastructure: connecting thought leaders through world-class conferences, developing human-centric residential estates, reducing carbon footprints via solar power, executing precision civil engineering, and fortifying enterprise digital infrastructure.
                  </p>
                  <ul className="space-y-2.5 pt-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Zero-compromise structural safety and international building code adherence</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Accelerating clean energy transition with bankable Tier-1 solar EPC</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Fostering global investments through high-impact summits and expositions</span>
                    </li>
                  </ul>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-video lg:aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"
                    alt="Corporate Architecture"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                    <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                      Corporate Headquarters & Engineering Hub
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reach' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white font-['Outfit',sans-serif]">
                    Bridging Domestic Frontiers with International Excellence
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    GreatStarGem coordinates cross-border partnerships across Europe, Africa, the Middle East, and North America. Whether curating a bilateral government summit or importing industrial solar inverters and structural steel, we combine deep domestic regulatory mastery with global supply chain velocity.
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-2xl font-bold text-white font-['Outfit',sans-serif]">38+</span>
                      <p className="text-xs text-slate-400 mt-1">Countries represented in our facilitated summits</p>
                    </div>
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-2xl font-bold text-white font-['Outfit',sans-serif]">100%</span>
                      <p className="text-xs text-slate-400 mt-1">Compliance with local statutory and environmental laws</p>
                    </div>
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-video lg:aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80"
                    alt="Global Stakeholders Meeting"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                    <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                      Diplomatic Protocol & International Cooperation
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'synergy' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white font-['Outfit',sans-serif]">
                    The Power of an Integrated Value Chain
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Unlike fragmented vendors, our 5 divisions operate in seamless concert:
                  </p>
                  <div className="space-y-3 pt-1 text-sm text-slate-300">
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 shrink-0" />
                      <p>
                        <strong className="text-white font-semibold">Real Estate + Solar:</strong> Our residential and commercial developments come pre-integrated with clean solar microgrids, eliminating reliance on unstable municipal power.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 shrink-0" />
                      <p>
                        <strong className="text-white font-semibold">Engineering + ICT:</strong> Civil infrastructure is paired with smart IoT structural sensors, automated BMS, and fiber-optic communication tunnels.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 shrink-0" />
                      <p>
                        <strong className="text-white font-semibold">Conferences + Deal Rooms:</strong> Summits host investment deal tables where our real estate and clean energy portfolios secure direct capital commitments.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-video lg:aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
                    alt="Multidisciplinary Enterprise Synergy"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                    <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                      Turnkey Conglomerate Architecture
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Core Values Section */}
        <div className="mt-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit',sans-serif]">
              Our Operating Principles
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Values that anchor every contract, blueprint, summit, and line of code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_VALUES.map((val, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 hover:border-teal-500/40 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-300 flex items-center justify-center font-mono font-bold text-sm mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  0{idx + 1}
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-teal-300 transition-colors">
                  {val.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Trust Badges */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-around gap-6 text-slate-400 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-400" />
            <span>Chartered Engineering Council Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>ISO 9001 Quality & Safety Assured</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <span>International Event Organizers Protocol</span>
          </div>
        </div>

      </div>
    </section>
  );
}
