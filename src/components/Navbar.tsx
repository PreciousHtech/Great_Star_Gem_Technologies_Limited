import { useState, useEffect } from 'react';
import { Menu, X, Gem, PhoneCall, ArrowRight } from 'lucide-react';

interface NavbarProps {
  onOpenConsultation?: () => void;
}

export const NAV_LINKS = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Projects', href: '#projects' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Contact', href: '#contact' },
];

export default function Navbar({ onOpenConsultation }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Simple active link detection
      const sections = ['home', 'about', 'services', 'projects', 'testimonials', 'contact'];
      const scrollPos = window.scrollY + 180;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#home');
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
            id="navbar-brand-logo"
          >
            <div>
              <div className="w-15 h-15 bg-black rounded-full flex items-center justify-center">
                <div
                    className="w-7 h-7 bg-teal-700"
                    style={{
                      width: "40px",
                      height: "40px",
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
                Conglomerate & Consulting
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-1.5 rounded-full shadow-inner" id="desktop-nav-menu">
            {NAV_LINKS.map((link) => {
              const linkId = link.href.replace('#', '');
              const isActive = activeSection === linkId;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold shadow-md shadow-teal-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                  id={`nav-link-${linkId}`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Desktop Action Button - Purple Button */}
          <div className="hidden lg:flex items-center">
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('#contact');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md shadow-teal-600/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              id="header-cta-button"
            >
              <span>Book Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[69px] bg-slate-950/98 backdrop-blur-xl border-b border-slate-800 shadow-2xl px-6 py-6 transition-all animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const linkId = link.href.replace('#', '');
              const isActive = activeSection === linkId;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold'
                      : 'text-slate-200 hover:bg-slate-900 hover:text-white'
                  }`}
                  id={`mobile-nav-link-${linkId}`}
                >
                  {link.name}
                </a>
              );
            })}
            <div className="pt-4 mt-2 border-t border-slate-800/80">
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('#contact');
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-center font-semibold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white transition-colors shadow-md shadow-teal-600/25"
                id="mobile-nav-cta"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Book Consultation</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
