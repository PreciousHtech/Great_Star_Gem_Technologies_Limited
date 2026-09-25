import { ServiceItem, ProjectItem, TestimonialItem, FAQItem } from '../types';

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'conference',
    title: 'Global Conference for Local & International',
    shortTitle: 'Global Conferences',
    tagline: 'World-class summits, diplomatic assemblies, and high-impact corporate conventions',
    description: 'End-to-end turnkey event architecture connecting international dignitaries, industry leaders, and domestic stakeholders with seamless audiovisual, protocol, and translation infrastructure.',
    fullDescription: 'GreatStarGem orchestrates high-stakes international summits, bilateral symposiums, multilateral forums, and corporate conferences. We handle venue design, multilingual simultaneous interpretation, high-security protocol management, hybrid global broadcasting, delegate registration logistics, and executive catering.',
    iconName: 'Globe',
    badge: 'International Reach',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    features: [
      'High-level VIP & Diplomatic Protocol Management',
      'Multilingual AI & Live Simultaneous Interpretation',
      'Ultra-HD Hybrid Streaming & Virtual Delegate Portals',
      'Venue Selection, Stage Scenography & Acoustical Engineering',
      'Accreditation, Biometric Badge Access & Concierge Support'
    ],
    deliverables: [
      'Summit Master Production Schedule & Playbook',
      'Global Delegate Digital Directory & Mobile App',
      'Media Press Center & Broadcast Feeds',
      'Post-Conference Proceedings & Executive Whitepaper'
    ],
    metrics: [
      { label: 'Delegates Facilitated', value: '45,000+' },
      { label: 'Participating Nations', value: '38+' },
      { label: 'Live Stream Uptime', value: '99.98%' }
    ]
  },
  {
    id: 'real-estate',
    title: 'Real Estate Development',
    shortTitle: 'Real Estate Development',
    tagline: 'Sustainable architectural landmarks, premium residential communities, and commercial complexes',
    description: 'Transforming prime locations into eco-efficient residential estates, mixed-use commercial hubs, and luxury developments with resilient construction and long-term capital appreciation.',
    fullDescription: 'Our real estate division unites land acquisition, master planning, sustainable architecture, construction engineering, and facility management. We specialize in green building standards, smart homes, and integrated urban lifestyle estates.',
    iconName: 'Building2',
    badge: 'Sustainable Living',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Master Planned Gated Residential Communities',
      'Grade-A Commercial Towers & Co-working Hubs',
      'Eco-Smart Infrastructure with Zero-Net Water & Solar Integration',
      'Rigorous Title Verification & Regulatory Feasibility Studies',
      'Turnkey Property Management & Asset Monetization'
    ],
    deliverables: [
      'Architectural 3D BIM Models & Civil Schematics',
      'Statutory Approvals & Environmental Impact Certifications',
      'Turnkey Keys-in-Hand Handover with Guarantees',
      'Long-Term Facilities & Community Management Framework'
    ],
    metrics: [
      { label: 'Square Meters Built', value: '180,000+' },
      { label: 'Developed Communities', value: '14+' },
      { label: 'Occupancy Rate', value: '96.4%' }
    ]
  },
  {
    id: 'solar',
    title: 'Solar Power Installation',
    shortTitle: 'Solar Power Installation',
    tagline: 'Turnkey industrial, commercial, and residential photovoltaic clean energy systems',
    description: 'Tier-1 solar PV engineering, high-capacity energy storage, microgrid deployments, and ongoing EPC operations delivering energy autonomy and verified carbon reduction.',
    fullDescription: 'GreatStarGem designs, supplies, and installs heavy-duty solar energy systems. From multi-megawatt industrial rooftops and ground-mounted solar farms to commercial backup microgrids and smart residential lithium-storage setups, we guarantee optimal yield and 25-year reliability.',
    iconName: 'Sun',
    badge: 'Clean Energy EPC',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80',
    features: [
      'Tier-1 Monocrystalline Bifacial PV Modules',
      'Industrial Hybrid Inverters & LiFePO4 Battery Storage',
      'Microgrid Remote Monitoring & Predictive SCADA Analytics',
      'Net-Metering & Grid Interconnection Engineering',
      'Zero-Downtime Commercial Power Transition Systems'
    ],
    deliverables: [
      'Solar Irradiance & Yield Simulation Report (PVSyst)',
      'Structural Load Certification & Single Line Diagrams (SLD)',
      'Utility Grid Approval & Fire Safety Clearances',
      '25-Year Performance Warranty & O&M Service Agreement'
    ],
    metrics: [
      { label: 'Clean Power Installed', value: '42+ MW' },
      { label: 'CO2 Offset Annually', value: '62,000 Tons' },
      { label: 'Operational Efficiency', value: '98.7%' }
    ]
  },
  {
    id: 'engineering',
    title: 'Engineering Services',
    shortTitle: 'Engineering Services',
    tagline: 'Multi-disciplinary civil, structural, mechanical, and electrical engineering expertise',
    description: 'Precision engineering design, infrastructure development, heavy industrial fabrication, and rigorous QA/QC oversight adhering to British and International building codes.',
    fullDescription: 'Our licensed engineers deliver comprehensive structural engineering, civil infrastructure (roads, bridges, drainage), MEP (mechanical, electrical, plumbing) designs, geotechnical evaluations, and industrial procurement management for public and private sector projects.',
    iconName: 'Wrench',
    badge: 'Precision Standards',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Structural Analysis & Seismic Resilient Design',
      'Civil Transportation & Highway Infrastructure',
      'MEP (Mechanical, Electrical, Plumbing) Engineering',
      'Non-Destructive Testing (NDT) & Soil Geotechnical Surveys',
      'Project Management Consultancy (PMC) with ISO 9001 Compliance'
    ],
    deliverables: [
      'Detailed Engineering Design (DED) CAD Packages',
      'Bills of Quantities (BOQ) & Tender Documentation',
      'Site Inspection Reports & Structural Integrity Seals',
      'Material Quality Verification & Environmental Assessments'
    ],
    metrics: [
      { label: 'Major Works Executed', value: '120+' },
      { label: 'Licensed Engineers', value: '45+' },
      { label: 'Zero-Accident Days', value: '1,450+' }
    ]
  },
  {
    id: 'ict',
    title: 'ICT Solutions & Consultancy',
    shortTitle: 'ICT Solutions & Consultancy',
    tagline: 'Enterprise digital transformation, cybersecurity, cloud architecture, and strategic IT advisory',
    description: 'Empowering institutions with resilient enterprise networks, secure cloud infrastructure, custom bespoke software systems, and data governance frameworks.',
    fullDescription: 'GreatStarGem ICT provides holistic technology modernization. We help governments, financial corporations, and large-scale enterprises implement high-availability network backbones, data center virtualization, zero-trust cybersecurity, custom ERP solutions, and strategic digital transformation advisory.',
    iconName: 'Cpu',
    badge: 'Next-Gen Technology',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Enterprise Fiber & Wireless Network Infrastructure',
      'Zero-Trust Cybersecurity & Penetration Audits',
      'Cloud Migration (AWS, Azure, Hybrid Private Clouds)',
      'Custom ERP & Workflow Automation Engineering',
      'Strategic IT Modernization & Regulatory Compliance Advisory'
    ],
    deliverables: [
      'Architecture Blueprint & Disaster Recovery SLA',
      'Cyber Risk Assessment & Mitigation Plan',
      'Turnkey Source Code, API Documentation & Repositories',
      '24/7 Managed NOC (Network Operations Center) Support'
    ],
    metrics: [
      { label: 'Systems Deployed', value: '230+' },
      { label: 'Network Uptime SLA', value: '99.99%' },
      { label: 'Enterprise Clients', value: '85+' }
    ]
  },
  {
    id: 'web-application',
    title: 'Web Application Development',
    shortTitle: 'Web Applications',
    tagline: 'Modern, high-performance full-stack web applications and cloud platforms',
    description: 'Bespoke web applications, real-time enterprise dashboards, progressive web apps (PWAs), and scalable SaaS solutions engineered for high availability.',
    fullDescription: 'Our Web Application engineering division specializes in modern full-stack development using Next.js, React, Node.js, and cloud native architectures. We architect mission-critical web applications with sub-second response times, zero-trust security, real-time WebSocket communication, and responsive UX across all devices.',
    iconName: 'Cpu',
    badge: 'Full-Stack Engineering',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Modern Single-Page (SPA) & Progressive Web Applications (PWA)',
      'Real-Time WebSocket Dashboards & Telemetry Monitoring',
      'End-to-End Encrypted REST & GraphQL Microservice APIs',
      'Role-Based Access Control (RBAC) & Single Sign-On (SSO)',
      'Automated CI/CD Pipelines & Cloud Edge Deployment'
    ],
    deliverables: [
      'Production Web Application Codebase & Clean Git Repositories',
      'Interactive Swagger / OpenAPI Documentation',
      'Automated Unit, E2E & Load Testing Test Suites',
      'Cloud SLA Infrastructure Provisioning & DevOps Documentation'
    ],
    metrics: [
      { label: 'Uptime SLA', value: '99.99%' },
      { label: 'Core Web Vitals Score', value: '98/100' },
      { label: 'Web Applications Delivered', value: '50+' }
    ]
  }
];

export const PROJECTS_DATA: ProjectItem[] = [];

export const TESTIMONIALS_DATA: TestimonialItem[] = [];

export const COMPANY_STATS = [
  { value: '250+', label: 'Delivered Projects', subtext: 'Across all 5 divisions' },
  { value: '35+', label: 'Global Summits', subtext: 'Local & international reach' },
  { value: '45+ MW', label: 'Solar Clean Energy', subtext: 'Commercial & industrial EPC' },
  { value: '99.8%', label: 'Client Satisfaction', subtext: 'Institutional & private partners' }
];

export const CORE_VALUES = [
  {
    title: 'Integrity & Transparency',
    description: 'We adhere to uncompromising ethical codes, transparent contract schedules, and open financial accountability in every engagement.'
  },
  {
    title: 'Engineering Precision',
    description: 'Whether constructing a skyscraper, engineering a solar microgrid, or deploying code, precision and international quality standards guide our hands.'
  },
  {
    title: 'Global Standards, Local Execution',
    description: 'We bring international best practices, cutting-edge technologies, and seasoned global experts while respecting and optimizing local community impact.'
  },
  {
    title: 'Sustainable Innovation',
    description: 'Every project is engineered for long-term ecological balance, energy efficiency, and future-proof digital resilience.'
  }
];

export const FAQS_DATA: FAQItem[] = [
  {
    category: 'Conferences',
    question: 'How far in advance should we engage GreatStarGem for an international conference?',
    answer: 'For large-scale international summits involving diplomatic delegations, simultaneous interpretation, and high-security protocols, we recommend engaging us 3 to 6 months prior. However, our rapid response event teams can execute regional symposiums within 3 to 4 weeks.'
  },
  {
    category: 'Solar Energy',
    question: 'Can your solar power systems integrate seamlessly with existing diesel generators and utility grids?',
    answer: 'Yes. Our engineers specialize in hybrid microgrid controllers and zero-feed-in synchronization switches that prioritize solar generation, draw from battery storage during peak tariffs, and only cycle diesel generators as emergency backups with sub-10ms transfer time.'
  },
  {
    category: 'Real Estate',
    question: 'What guarantees and documentation are provided for real estate developments?',
    answer: 'All GreatStarGem real estate projects carry unencumbered government approved titles, certified environmental impact reports, structural integrity warranties, and full architectural BIM documentation. We also offer managed rental programs for institutional investors.'
  },
  {
    category: 'Engineering',
    question: 'What engineering standards and compliance codes do your teams follow?',
    answer: 'We operate strictly under ISO 9001 quality management, British Standards (BS), Eurocodes, and relevant local federal regulatory codes. Every drawing and structural assessment is certified by licensed COREN / chartered civil and structural engineers.'
  },
  {
    category: 'ICT & Consulting',
    question: 'What support and SLA packages do you offer for ICT solutions?',
    answer: 'We offer round-the-clock 24/7/365 Network Operations Center (NOC) monitoring, 99.99% uptime guarantees, periodic penetration testing, and guaranteed maximum 15-minute response times for critical enterprise infrastructure.'
  }
];
