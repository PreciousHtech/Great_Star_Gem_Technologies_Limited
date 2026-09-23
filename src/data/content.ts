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
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
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
  }
];

export const PROJECTS_DATA: ProjectItem[] = [
  
  {
    id: 'proj-1',
    title: 'Global Energy Transition Summit',
    category: 'conference',
    categoryName: 'Global Conferences',
    location: 'Geneva & Virtual Broadcast',
    year: '2025',
    client: 'International Renewable Consortium',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    summary: 'A 4-day multilateral summit uniting 3,200 in-person dignitaries and 18,000 digital attendees across 42 countries.',
    challenge: 'Coordination of strict heads-of-state diplomatic protocol alongside 6 simultaneous interpretation languages and zero-latency hybrid streaming.',
    solution: 'Designed redundant fiber broadcast uplinks, deployed custom AI translation headsets, and managed biometric accreditation security gates.',
    impactMetrics: ['3,200 In-Person VIPs', '6 Languages Interpreted', '100% Broadcast Uptime'],
    status: 'published'
  },
  {
    id: 'proj-2',
    title: 'Grand Starline Waterfront Residences',
    category: 'real-estate',
    categoryName: 'Real Estate Development',
    location: 'Lekki Coastal Corridor',
    year: '2024',
    client: 'Starline Luxury Properties Ltd',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    summary: 'A master-planned luxury waterfront gated community consisting of 64 smart villas with internal solar microgrid and smart drainage.',
    challenge: 'Developing low-impact coastal land requiring advanced soil stabilization and flood-resilient civil engineering.',
    solution: 'Engineered specialized geotextile retaining barriers, automated water recycling systems, and architectural bioclimatic airflow designs.',
    impactMetrics: ['64 Luxury Units', '100% Sold Out in Phase 1', '40% Energy Reduction'],
    status: 'published'
  },
  {
    id: 'proj-3',
    title: '8.4 MW Industrial Agro-Processing Solar Plant',
    category: 'solar',
    categoryName: 'Solar Power Installation',
    location: 'Ogun Industrial Zone',
    year: '2024',
    client: 'Crown Agro-Allied Industries',
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
    summary: 'Comprehensive ground-mount and rooftop hybrid solar installation powering heavy industrial flour mills and cold storage 24/7.',
    challenge: 'Eliminating severe diesel generator expenditure during recurrent national grid voltage drops without interrupting milling lines.',
    solution: 'Installed 18,500 bifacial solar modules coupled with 12MWh LiFePO4 industrial battery banks with sub-10ms microgrid transfer switches.',
    impactMetrics: ['8.4 MWp Installed', '$1.4M Saved Annually', '11,200 Tons CO2 Cut'],
    status: 'published'
  },
  {
    id: 'proj-4',
    title: 'Trans-Metropolitan Flyover & Drainage Interchange',
    category: 'engineering',
    categoryName: 'Engineering Services',
    location: 'Central Capital Corridor',
    year: '2023',
    client: 'Federal Ministry of Works & Infrastructure',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
    summary: 'Turnkey structural civil engineering and project supervision for a 1.8km dual-carriage elevated arterial flyover.',
    challenge: 'Constructing heavily reinforced concrete piers amid dense commercial traffic corridors without shutting down daily traffic flows.',
    solution: 'Adopted pre-cast post-tensioned segmental box girders erected during controlled night shifts with continuous laser deflection monitoring.',
    impactMetrics: ['1.8km Flyover Span', 'Zero Lost Time Incidents', 'Completed 2 Months Early'],
    status: 'published'
  },
  {
    id: 'proj-5',
    title: 'National Financial Switch Cloud & SecOps Backbone',
    category: 'ict',
    categoryName: 'ICT Solutions & Consultancy',
    location: 'Regional Central Banking Data Center',
    year: '2025',
    client: 'Apex Financial Technologies Network',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    summary: 'End-to-end modernization of mission-critical banking switch infrastructure to PCI-DSS certified hybrid cloud architecture.',
    challenge: 'Upgrading legacy payment routing processing over 8 million transactions daily without a single second of service disruption.',
    solution: 'Designed active-active multi-region Kubernetes clusters with zero-trust network segmentation and continuous automated pen-testing.',
    impactMetrics: ['14M Daily Transactions', '99.999% SLA Uptime', 'Sub-18ms Latency'],
    status: 'published'
  },
  {
    id: 'proj-6',
    title: 'International Trade & Investment Exposition',
    category: 'conference',
    categoryName: 'Global Conferences',
    location: 'Metropolitan Expo Center',
    year: '2024',
    client: 'Commonwealth Bilateral Chamber of Commerce',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    summary: 'Three-day bilateral trade convention with 450 corporate exhibition booths, B2B deal rooms, and ministerial plenary sessions.',
    challenge: 'Managing over 12,000 visitors per day, high-density RF communications for live broadcasting, and automated matchmaking.',
    solution: 'Engineered a specialized NFC business matchmaking app, temporary multi-gigabit Wi-Fi 6 coverage, and curated breakout suites.',
    impactMetrics: ['450 Exhibitor Pavilions', '$85M in MOUs Signed', '12,000+ Daily Visitors'],
    status: 'published'
  }
];

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: 'test-pepple',
    name: 'Sir Richard Sodienye Pepple',
    role: 'Supervisor',
    organization: 'Technoville Innovation',
    country: 'Nigeria',
    serviceCategory: 'web-dev',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    quote: 'Great technical collaboration on web development projects.',
    createdAt: '2025-01-15'
  },
  {
    id: 'test-princewill',
    name: 'Emmanuel Princewill',
    role: 'Project Lead',
    organization: 'RSU',
    country: 'Nigeria',
    serviceCategory: 'e-commerce',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    quote: 'Delivered the Suxul e-commerce project with high quality.',
    createdAt: '2025-02-20'
  },
  {
    id: 't-1',
    name: 'Dr. Alistair Sterling',
    role: 'Secretary General',
    organization: 'Global Sustainable Energy Alliance',
    country: 'United Kingdom / Switzerland',
    serviceCategory: 'conference',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    quote: 'GreatStarGem delivered an impeccably organized international conference. From high-level diplomatic protocols to live multilingual interpretation and hybrid broadcasts, every single detail was executed with military precision.'
  },
  {
    id: 't-2',
    name: 'Engr. Folashade Adeyemi',
    role: 'Chief Operating Officer',
    organization: 'PrimeStone Agro-Processing Mills',
    country: 'Nigeria',
    serviceCategory: 'solar',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    quote: 'Our factory previously suffered crippling diesel costs and production stoppages. GreatStarGem designed and installed an 8.4MW solar hybrid system that reduced our energy overhead by 68% while running our equipment flawlessly.'
  },
  {
    id: 't-3',
    name: 'Marcus Vance',
    role: 'Principal Investment Director',
    organization: 'Horizon Crest Capital Partners',
    country: 'United States',
    serviceCategory: 'real-estate',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    quote: 'Investing in real estate developments managed by GreatStarGem has yielded exceptional ROI. Their construction quality, structural discipline, and adherence to environmental standards set a new benchmark in property development.'
  },
  {
    id: 't-4',
    name: 'Clara M. Lindqvist',
    role: 'Head of Infrastructure Oversight',
    organization: 'Nordic Trans-Development Fund',
    country: 'Sweden',
    serviceCategory: 'engineering',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    quote: 'Their civil and structural engineering team displays uncompromising technical rigor. The flyover and drainage structural project was completed two months ahead of schedule with zero safety incidents.'
  },
  {
    id: 't-5',
    name: 'Tariq Al-Mansoor',
    role: 'Chief Information Officer',
    organization: 'FinTech Secure Gateway',
    country: 'United Arab Emirates',
    serviceCategory: 'ict',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    quote: 'GreatStarGem ICT revamped our core data architecture into a resilient hybrid cloud environment with zero-trust cybersecurity. Our system latency dropped 45% while handling unprecedented transaction spikes.'
  }
];

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
