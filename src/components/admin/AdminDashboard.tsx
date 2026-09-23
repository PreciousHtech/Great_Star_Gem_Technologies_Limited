import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderGit2, MessageSquareQuote, ShieldAlert, LogOut, ExternalLink, 
  Radio, Layers, Database
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import ProjectsTab from './ProjectsTab';
import TestimonialsTab from './TestimonialsTab';
import SecuritySettingsTab from './SecuritySettingsTab';
import DatabaseTab from './DatabaseTab';

const TABS = [
  { id: 0, label: 'Portfolio Projects', icon: FolderGit2 },
  { id: 1, label: 'Client Testimonials', icon: MessageSquareQuote },
  { id: 2, label: 'Security & Settings', icon: ShieldAlert },
  { id: 3, label: 'Database & Supabase', icon: Database }
];

const tabVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 70 : -70,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring' as const, stiffness: 350, damping: 30 },
      opacity: { duration: 0.2 }
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -70 : 70,
    opacity: 0,
    transition: {
      x: { type: 'spring' as const, stiffness: 350, damping: 30 },
      opacity: { duration: 0.15 }
    }
  }),
};

export default function AdminDashboard() {
  const { adminLogout, navigateTo, adminSettings, dbStatus } = useData();

  // Tab 0 (Portfolio Projects) MUST be set as default active tab upon login
  const [activeTab, setActiveTab] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);

  const handleTabChange = (newIndex: number) => {
    if (newIndex === activeTab) return;
    setDirection(newIndex > activeTab ? 1 : -1);
    setActiveTab(newIndex);
  };

  const handleLogout = () => {
    adminLogout();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-teal-600 selection:text-white">
      {/* Background Ambience Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[25rem] bg-teal-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ADMIN HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Left: Branding & Status Indicator */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm sm:text-base text-teal-400 tracking-wider bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/25">
                 ADMIN PORTAL 
              </span>
            </div>

            {/* Status indicator */}
            <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              dbStatus.connected 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' 
                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span>{dbStatus.connected ? 'PostgreSQL Live|Connected' : 'Local Storage Mode|Database not connected'}</span>
            </div>
          </div>

          {/* Right: Logged in info & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-white">
                Logged in as: <span className="text-teal-300 font-mono font-bold">{adminSettings.username || 'Admin'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange(2)}
                className="text-[10px] text-teal-400 hover:text-teal-300 hover:underline cursor-pointer block text-right ml-auto font-medium"
                title="Change username or password in Security Settings"
              >
                Change Admin Name / Pass
              </button>
            </div>

            {/* View Public Website */}
            <button
              type="button"
              onClick={() => navigateTo('public')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Open Public Website"
              id="admin-view-website-btn"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Website</span>
            </button>

            {/* Log Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-950/40 border border-red-800/40 text-red-300 hover:bg-red-900/50 hover:border-red-700 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              id="admin-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS WITH SLIDING HIGHLIGHT PILL */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900/80">
          <div className="flex items-center space-x-1 sm:space-x-2 py-2.5 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id={`admin-tab-${tab.id}`}
                >
                  {/* Sliding background highlight pill */}
                  {isActive && (
                    <motion.div
                      layoutId="admin-active-tab-pill"
                      className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl shadow-md shadow-teal-600/30"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA WITH HORIZONTAL SLIDING TRANSITIONS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            {activeTab === 0 && <ProjectsTab />}
            {activeTab === 1 && <TestimonialsTab />}
            {activeTab === 2 && <SecuritySettingsTab />}
            {activeTab === 3 && <DatabaseTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500 font-mono">
        GreatStarGemTechnologies Admin Console • Encrypted Dynamic CMS Engine
      </footer>
    </div>
  );
}
