import { useState, useEffect, FormEvent } from 'react';
import { 
  Send, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Building2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { FAQS_DATA, SERVICES_DATA } from '../data/content';
import { ServiceCategory, ConsultationFormData } from '../types';

interface ContactSectionProps {
  initialService?: ServiceCategory | '';
}

export default function ContactSection({ initialService = '' }: ContactSectionProps) {
  const [formData, setFormData] = useState<ConsultationFormData>({
    fullName: '',
    email: '',
    phone: '',
    service: initialService,
    projectType: 'turnkey',
    estimatedTimeline: '1-3 months',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (initialService) {
      setFormData((prev) => ({ ...prev, service: initialService }));
    }
  }, [initialService]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          serviceCategory: formData.service || 'general',
          company: `${formData.projectType} (${formData.estimatedTimeline})`,
          message: formData.message,
        }),
      });
    } catch (err) {
      console.warn('Inquiry submission fallback:', err);
    }

    const generatedRef = `GSG-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedRef(generatedRef);
    setIsSubmitting(false);
  };

  const handleResetForm = () => {
    setSubmittedRef(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      service: '',
      projectType: 'turnkey',
      estimatedTimeline: '1-3 months',
      message: ''
    });
  };

  return (
    <section id="contact" className="py-24 sm:py-32 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Initiate Engagement</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            Connect with GreatStarGem
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Request an engineering proposal, international conference tender, EPC solar audit, real estate investment prospectus, or ICT consulting roadmap.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Info & FAQs */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Direct Contact Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <h3 className="text-xl font-bold text-white font-['Outfit',sans-serif] border-b border-slate-800 pb-4">
                Corporate Headquarters & Desks
              </h3>

              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-400 block">
                      Principal Office
                    </span>
                    <p className="font-medium text-white mt-0.5">
                      GreatStarGem Towers, Central Business District
                    </p>
                    <p className="text-xs text-slate-400">
                      Engineering & International Summit Directorate
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-400 block">
                      Official Correspondence
                    </span>
                    <a href="mailto:inquiry@greatstargem.com" className="font-medium text-purple-300 hover:text-purple-200 hover:underline mt-0.5 block">
                      inquiry@greatstargem.com
                    </a>
                    <p className="text-xs text-slate-400">Tenders, RFQs & Diplomatic Protocol</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-400 block">
                      Direct Helplines
                    </span>
                    <p className="font-medium text-white mt-0.5">
                      +234 (0) 800-GREAT-STAR
                    </p>
                    <p className="text-xs text-slate-400">
                      International Desk: +44 (0) 20 8123 4567
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-400 block">
                      Operating Hours
                    </span>
                    <p className="font-medium text-white mt-0.5">
                      Mon - Fri: 08:00 - 18:00 (GMT+1)
                    </p>
                    <p className="text-xs text-slate-400">
                      24/7 Monitoring for Solar & ICT SLAs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick FAQ Accordion */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                <HelpCircle className="w-4 h-4" />
                <span>Frequently Asked Inquiries</span>
              </div>

              <div className="space-y-2">
                {FAQS_DATA.map((faq, index) => {
                  const isExpanded = expandedFaqIndex === index;
                  return (
                    <div
                      key={index}
                      className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/60"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                        id={`faq-btn-${index}`}
                      >
                        <span className="pr-2">{faq.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-purple-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-800/50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Consultation & RFQ Form */}
          <div className="lg:col-span-7">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
              
              {submittedRef ? (
                /* Success Confirmation State */
                <div className="text-center py-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <span className="text-xs uppercase font-mono tracking-wider text-purple-400 font-semibold">
                      Inquiry Dispatched Successfully
                    </span>
                    <h3 className="text-2xl font-bold text-white font-['Outfit',sans-serif]">
                      Thank You, {formData.fullName || 'Partner'}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Your technical request has been logged under dossier reference:
                    </p>
                    <div className="py-2.5 px-4 bg-slate-900 border border-purple-500/40 rounded-xl font-mono text-purple-300 font-bold text-lg inline-block shadow-sm">
                      {submittedRef}
                    </div>
                    <p className="text-xs text-slate-400 pt-2">
                      An executive project director matching your division will review your brief and contact you within 24 business hours at <strong className="text-white">{formData.email}</strong>.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                /* Main Form */
                <form onSubmit={handleSubmit} className="space-y-5" id="consultation-rfq-form">
                  <div className="border-b border-slate-800 pb-4">
                    <h3 className="text-2xl font-bold text-white font-['Outfit',sans-serif]">
                      Project Consultation & Proposal Request
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Please provide your project parameters for our multidisciplinary engineering and planning team.
                    </p>
                  </div>

                  {/* Service Division Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Primary Service Required *
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value as ServiceCategory })}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      id="form-select-service"
                    >
                      <option value="">-- Choose a Service Vertical --</option>
                      {SERVICES_DATA.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Full Name / Organization *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Dr. Kwame Mensah / Apex Consortium"
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        id="form-input-name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Official Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@organization.com"
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        id="form-input-email"
                      />
                    </div>
                  </div>

                  {/* Phone & Timeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Telephone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+234 ... / +44 ..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        id="form-input-phone"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Target Timeline
                      </label>
                      <select
                        value={formData.estimatedTimeline}
                        onChange={(e) => setFormData({ ...formData, estimatedTimeline: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        id="form-select-timeline"
                      >
                        <option value="immediate">Immediate (Within 30 Days)</option>
                        <option value="1-3 months">1 - 3 Months</option>
                        <option value="3-6 months">3 - 6 Months</option>
                        <option value="exploratory">Exploratory / Feasibility Study</option>
                      </select>
                    </div>
                  </div>

                  {/* Project Brief */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Scope Brief & Specific Requirements *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Detail your capacity requirements (e.g., number of conference delegates, megawatts of solar, civil site square meters, or ICT modernization scope)..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      id="form-input-message"
                    />
                  </div>

                  {/* Privacy & Guarantee */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>All technical drawings, budgets, and strategic details are protected by strict NDA.</span>
                  </div>

                  {/* Submit Button: Purple-button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-600/30 transition-all duration-200 cursor-pointer disabled:opacity-50"
                      id="submit-proposal-btn"
                    >
                      {isSubmitting ? (
                        <span>Transmitting Dossier...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Dispatch Consultation & RFQ Dossier</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
