import { useState, FormEvent } from 'react';
import { /* UNUSED CODE - READY FOR DELETION: Gem, */ ArrowUp, Send, CheckCircle2, Shield } from 'lucide-react';
import { NAV_LINKS } from './Navbar';
import { SERVICES_DATA } from '../data/content';

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (href: string) => {
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-12 sm:pt-16 pb-10 sm:pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 pb-10 sm:pb-12 border-b border-slate-800/80">
          
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-full flex items-center justify-center">
                  <div
                      className="bg-teal-600"
                      style={{
                        width: "36px",
                        height: "36px",
                        WebkitMaskImage: "url(/GreatStarGem_Logo.png)",
                        maskImage: "url(/GreatStarGem_Logo.png)",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                      }}
                    />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white font-['Outfit',sans-serif]">
                  GreatStar<span className="text-teal-500">Gem</span>
                </span>
                <span className="text-[10px] tracking-widest uppercase font-medium text-slate-400">
                  Global Conglomerate
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              GreatStarGem delivers high-level global conferences, resilient real estate development, commercial solar installations, civil engineering, and enterprise ICT solutions.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-teal-400/90 font-medium">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Accredited Global Partner & EPC Contractor</span>
            </div>
          </div>

          {/* Nav Links Col */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="inline-block py-1 sm:py-0.5 hover:text-teal-400 transition-colors cursor-pointer capitalize"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Col */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Core Divisions
            </h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              {SERVICES_DATA.map((s) => (
                <li key={s.id}>
                  <a
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('#services');
                    }}
                    className="inline-block py-1 sm:py-0.5 hover:text-teal-400 transition-colors cursor-pointer"
                  >
                    {s.shortTitle}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Col */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Executive Briefings
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscribe to our quarterly industrial briefing on global summits, energy transition, and infrastructure.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Subscription confirmed. Thank you.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter executive email..."
                    className="w-full px-3.5 pr-14 py-3 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-500 min-h-[48px]"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center shadow-sm min-w-[44px]"
                    aria-label="Subscribe to newsletter"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} GreatStarGemTechnologies. All rights reserved.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <span>ISO 9001:2015</span>
            <span>•</span>
            <span>GDPR Compliant</span>

            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer px-2 py-1 min-h-[44px]"
              id="back-to-top-btn"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
