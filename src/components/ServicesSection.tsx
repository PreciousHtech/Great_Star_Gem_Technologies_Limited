import { useState } from 'react';
import { 
  Globe, 
  Building2, 
  Sun, 
  Wrench, 
  Cpu, 
  ArrowRight, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  Layers
} from 'lucide-react';
import { SERVICES_DATA } from '../data/content';
import { ServiceItem, ServiceCategory } from '../types';

interface ServicesSectionProps {
  onOpenServiceModal: (service: ServiceItem) => void;
  onSelectServiceForContact: (serviceId: ServiceCategory) => void;
}

const ICON_MAP: Record<string, typeof Globe> = {
  Globe,
  Building2,
  Sun,
  Wrench,
  Cpu
};

export default function ServicesSection({ 
  onOpenServiceModal, 
  onSelectServiceForContact 
}: ServicesSectionProps) {
  // Calculator state
  const [calcService, setCalcService] = useState<ServiceCategory>('solar');
  const [calcScale, setCalcScale] = useState<'standard' | 'enterprise' | 'flagship'>('enterprise');

  const estimatorPlans: Record<
    ServiceCategory, 
    Record<'standard' | 'enterprise' | 'flagship', {
      scopeTitle: string;
      timeline: string;
      deliverables: string[];
      team: string;
    }>
  > = {
    conference: {
      standard: {
        scopeTitle: 'Regional Symposium & Exhibition (Up to 500 Delegates)',
        timeline: '3 - 6 Weeks Planning & Execution',
        deliverables: ['Stage & AV Rigging', 'Delegate Registration', 'Dual-Language Translation'],
        team: 'Lead Protocol Director + 8 Event Technicians'
      },
      enterprise: {
        scopeTitle: 'International Bilateral Forum (1,000 - 5,000 Delegates)',
        timeline: '2 - 4 Months Turnkey Production',
        deliverables: ['Head of State Protocol', 'Live 4K Global Broadcast', '5 Language Simultaneous Translation', 'B2B Deal Rooms'],
        team: 'Diplomatic Liaison Team + 25 AV/Security Specialists'
      },
      flagship: {
        scopeTitle: 'Global Multilateral Mega-Summit (5,000+ Delegates)',
        timeline: '4 - 8 Months Comprehensive Planning',
        deliverables: ['Full Expo Hall Scenography', 'Biometric Delegate Security', 'Multi-Continent Hybrid Uplinks', 'Whitepaper Proceedings'],
        team: 'Full Executive Committee + 60 Multidisciplinary Staff'
      }
    },
    'real-estate': {
      standard: {
        scopeTitle: 'Boutique Commercial or Residential Development (5 - 15 Units)',
        timeline: '9 - 14 Months Construction Cycle',
        deliverables: ['Architectural BIM Blueprints', 'Civil & Structural Execution', 'Standard Utility Hookups'],
        team: 'Project Manager + Resident Structural Engineer'
      },
      enterprise: {
        scopeTitle: 'Master-Planned Gated Community (20 - 70 Luxury Units)',
        timeline: '14 - 24 Months Phased Delivery',
        deliverables: ['Solar Microgrid Integration', 'Smart Drainage & Asphalt Paving', 'Recreational Clubhouse', 'Green Building Certification'],
        team: 'Principal Architect + Civil Infrastructure Taskforce'
      },
      flagship: {
        scopeTitle: 'High-Rise Mixed-Use Complex / Industrial Park Estate',
        timeline: '24 - 36 Months Turnkey Delivery',
        deliverables: ['Deep Foundation Piling', 'Grade-A Smart BMS Systems', 'Commercial Retail Anchor Spaces', 'Asset Management Handover'],
        team: 'Executive EPC Consortium + Turnkey Project Directors'
      }
    },
    solar: {
      standard: {
        scopeTitle: 'Commercial Rooftop PV Setup (20kWp - 100kWp)',
        timeline: '2 - 4 Weeks Turnkey Commissioning',
        deliverables: ['Tier-1 Monocrystalline PV', 'Industrial Hybrid Inverter', 'Smart Energy Metering'],
        team: 'Lead Solar Engineer + 4 Certified PV Technicians'
      },
      enterprise: {
        scopeTitle: 'Industrial Microgrid with Battery Storage (250kWp - 1.5MWp)',
        timeline: '6 - 12 Weeks Design & Installation',
        deliverables: ['LiFePO4 Containerized BESS', 'Generator Sync Automation', 'SCADA Cloud Monitoring', 'Zero-Export Protection'],
        team: 'Senior Electrical Power Engineer + 12 Field Technicians'
      },
      flagship: {
        scopeTitle: 'Utility Scale / Multi-Megawatt Solar Farm (2MWp - 20MWp+)',
        timeline: '4 - 8 Months Engineering & Commissioning',
        deliverables: ['Geotechnical Rammed Piling', 'High-Voltage Transformer Substation', 'Grid Interconnection Approval', '25-Year O&M Contract'],
        team: 'Principal EPC Director + Specialized Substation Engineers'
      }
    },
    engineering: {
      standard: {
        scopeTitle: 'Structural Integrity Assessment & Architectural Engineering',
        timeline: '2 - 4 Weeks Evaluation & Design',
        deliverables: ['NDT Concrete Ultrasonic Testing', 'CAD Construction Drawings', 'Structural Integrity Seal'],
        team: 'Chartered Structural Engineer + Field Inspector'
      },
      enterprise: {
        scopeTitle: 'Civil Infrastructure, Highway or Industrial Bridge Works',
        timeline: '4 - 12 Months Execution',
        deliverables: ['Hydraulic Drainage Modeling', 'Pavement Design & Geotextile Layering', 'Quality Assurance & BOQ Audits'],
        team: 'Civil Transportation Engineer + Surveyor Team'
      },
      flagship: {
        scopeTitle: 'Major Public Works / Turnkey Heavy Industrial Fabrication',
        timeline: '12 - 24 Months Comprehensive Execution',
        deliverables: ['Steel Superstructure Erection', 'MEP High-Capacity Integration', 'ISO 9001 Safety Management', 'Statutory Ministry Handover'],
        team: 'Master Resident Engineer + Dedicated Safety Officers'
      }
    },
    ict: {
      standard: {
        scopeTitle: 'Enterprise Network Backbone & Cybersecurity Hardening',
        timeline: '2 - 4 Weeks Implementation',
        deliverables: ['Next-Gen Firewall Setup', 'Managed Wi-Fi 6 Infrastructure', 'Vulnerability Penetration Scan'],
        team: 'Senior Network Architect + Cyber Security Engineer'
      },
      enterprise: {
        scopeTitle: 'Hybrid Cloud Migration & Custom ERP Workflow Automation',
        timeline: '2 - 5 Months Phased Deployment',
        deliverables: ['AWS / Azure Cloud Infrastructure', 'Secure API Integration', 'Data Backup & Disaster Recovery SLA'],
        team: 'Cloud Solutions Architect + Full-Stack DevOps Engineers'
      },
      flagship: {
        scopeTitle: 'Mission-Critical Banking Switch / National Datacenter Architecture',
        timeline: '6 - 12 Months High-Security Modernization',
        deliverables: ['Zero-Trust Architecture', 'Active-Active Multi-Region High Availability', '24/7 Managed NOC & SOC Monitoring'],
        team: 'Principal Enterprise Architect + Cyber Defence Team'
      }
    },
    'e-commerce': {
      standard: {
        scopeTitle: 'Custom Storefront & Payment Integration (Up to 500 SKUs)',
        timeline: '3 - 5 Weeks Deployment',
        deliverables: ['Custom Product Catalog', 'Stripe / Paystack Payment Gateway', 'Order & Inventory Automation'],
        team: 'Full-Stack Developer + UI/UX Designer'
      },
      enterprise: {
        scopeTitle: 'Multi-Vendor Marketplace & Omnichannel Commerce',
        timeline: '2 - 4 Months Phased Architecture',
        deliverables: ['Headless Commerce Engine', 'Multi-Currency Settlement', 'Warehouse Real-Time Sync', 'Custom Checkout Funnels'],
        team: 'Lead Solution Architect + 3 Full-Stack Engineers'
      },
      flagship: {
        scopeTitle: 'Global High-Throughput E-Commerce Platform (100k+ Transactions/day)',
        timeline: '4 - 8 Months Microservices Scale',
        deliverables: ['Elastic Cloud Infrastructure', 'AI Recommendation Engine', 'Automated Fraud Defense', '99.99% Uptime SLA'],
        team: 'Principal Systems Architect + SRE & Security Engineers'
      }
    },
    'web-dev': {
      standard: {
        scopeTitle: 'Modern Web Application & API Portal',
        timeline: '3 - 6 Weeks Agile Sprints',
        deliverables: ['React / TypeScript SPA', 'REST / GraphQL API Endpoints', 'Responsive Mobile-First UI'],
        team: 'Frontend Specialist + Backend Engineer'
      },
      enterprise: {
        scopeTitle: 'Enterprise SaaS Platform with RBAC & Analytics',
        timeline: '2 - 5 Months Production Build',
        deliverables: ['Multi-Tenant Architecture', 'Real-Time Dashboard', 'SOC-2 Compliance Prep', 'Automated CI/CD Pipeline'],
        team: 'Product Engineer + Cloud Architect + QA Lead'
      },
      flagship: {
        scopeTitle: 'Distributed Microservices & Real-Time Data Pipeline',
        timeline: '6 - 12 Months Enterprise Modernization',
        deliverables: ['Event-Driven Kafka Architecture', 'Sub-millisecond Edge Delivery', 'Global Disaster Recovery', '24/7 Monitored Telemetry'],
        team: 'Engineering Director + Dedicated Full-Stack Pod'
      }
    }
  };

  const selectedEstimate = (estimatorPlans[calcService] || estimatorPlans.solar)[calcScale];

  const handleEstimateSelect = () => {
    onSelectServiceForContact(calcService);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-24 sm:py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Turnkey Expertise</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            Our Five Core Services
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            From international diplomatic summits to clean megawatt power plants and civil infrastructure, GreatStarGem delivers unmatched multidisciplinary execution.
          </p>
        </div>

        {/* 5 Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES_DATA.map((service, index) => {
            const IconComponent = ICON_MAP[service.iconName] || Globe;
            // The 4th and 5th items can span nicely on desktop if needed
            const isWide = index === 3 || index === 4;

            return (
              <div
                key={service.id}
                className={`bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-300 flex flex-col group ${
                  isWide ? 'lg:col-span-1' : ''
                }`}
                id={`service-card-${service.id}`}
              >
                {/* Image & Badge */}
                <div className="relative h-52 w-full overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-sm text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wide">
                      {service.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                      0{index + 1}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white font-['Outfit',sans-serif] group-hover:text-purple-400 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs font-medium text-purple-300/90">
                      {service.tagline}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                      {service.description}
                    </p>

                    {/* Features list */}
                    <div className="pt-2 space-y-2 border-t border-slate-800/80">
                      {service.features.slice(0, 3).map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Slate-button (explore) & Purple-button (book) */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onOpenServiceModal(service)}
                      className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      id={`view-scope-${service.id}`}
                    >
                      <span>Explore Scope</span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectServiceForContact(service.id);
                        const contactSection = document.getElementById('contact');
                        if (contactSection) {
                          contactSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-md shadow-purple-600/25 transition-all cursor-pointer"
                      id={`inquire-btn-${service.id}`}
                    >
                      Book Service
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Scope & Estimation Planner */}
        <div className="mt-20 bg-gradient-to-br from-slate-900 via-purple-950/25 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Controls */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase">
                <Calculator className="w-3.5 h-3.5" />
                <span>Project Scope & Feasibility Planner</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif]">
                Plan Your Engagement with GreatStarGem
              </h3>
              <p className="text-sm text-slate-300">
                Select your sector of interest and required project magnitude to view our standard turnkey timeline, technical composition, and execution deliverables.
              </p>

              {/* Step 1: Select Sector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  1. Select Service Vertical
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SERVICES_DATA.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCalcService(s.id)}
                      className={`p-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer truncate ${
                        calcService === s.id
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-600/25'
                          : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {s.shortTitle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Scale */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  2. Select Project Scale
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'enterprise', 'flagship'] as const).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setCalcScale(scale)}
                      className={`py-2 px-3 rounded-xl text-center text-xs font-semibold capitalize transition-all cursor-pointer ${
                        calcScale === scale
                          ? 'bg-slate-800 border-2 border-purple-500 text-purple-300 shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {scale} Scope
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Output Card */}
            <div className="lg:col-span-6 bg-slate-950/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs uppercase font-mono text-purple-400 font-semibold">
                  Feasibility Specification
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize border border-slate-700">
                  {calcScale} Scope
                </span>
              </div>

              <div>
                <h4 className="text-lg sm:text-xl font-bold text-white font-['Outfit',sans-serif]">
                  {selectedEstimate.scopeTitle}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Estimated Timeline</span>
                  </div>
                  <div className="font-semibold text-white">{selectedEstimate.timeline}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Resource Allocation</span>
                  </div>
                  <div className="font-semibold text-white">{selectedEstimate.team}</div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Key Scope Deliverables
                </span>
                <div className="space-y-1.5">
                  {selectedEstimate.deliverables.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleEstimateSelect}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                  id="estimator-proceed-btn"
                >
                  <span>Request Proposal with this Scope</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
