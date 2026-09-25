import { X, CheckCircle2, FileText, ArrowRight, Shield } from 'lucide-react';
import { ServiceItem } from '../types';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onInquire: (serviceId: string) => void;
}

export default function ServiceDetailModal({ service, onClose, onInquire }: ServiceDetailModalProps) {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image with close button */}
        <div className="relative h-52 sm:h-64 w-full">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white border border-slate-700 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-semibold uppercase tracking-wider">
              {service.badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-2">
              {service.title}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-teal-400 mb-2">
              Executive Overview
            </h4>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {service.fullDescription}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            {service.metrics.map((m, idx) => (
              <div key={idx} className="text-center">
                <div className="text-lg sm:text-xl font-bold text-white font-['Outfit',sans-serif]">
                  {m.value}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Core Capabilities */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-teal-400 mb-3">
              Core Capabilities & Methodologies
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {service.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-teal-400 mb-3">
              Standard Client Deliverables
            </h4>
            <div className="space-y-2">
              {service.deliverables.map((del, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs sm:text-sm text-slate-200">
                  <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{del}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Guarantee Notice */}
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-start gap-3 text-xs text-teal-200">
            <Shield className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <p>
              All GreatStarGem engagements include our formal Service Level Agreement (SLA), ISO 9001 compliance guarantees, and dedicated executive project director oversight.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onInquire(service.id);
              onClose();
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/30 transition-all cursor-pointer min-h-[44px]"
          >
            <span>Request Proposal for this Service</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
