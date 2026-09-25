require('dotenv').config();
const pg = require('pg');

const PROJECTS = [
  {
    id: 'proj-1',
    title: 'Solar Microgrid & Energy Automation System',
    category: 'renewable-energy',
    categoryName: 'Renewable Energy',
    location: 'Abuja & North-Central Region',
    year: '2025',
    client: 'Federal Agro-Industrial Processing Cluster',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    summary: 'Turnkey 450 kWp commercial solar microgrid coupled with 1.2 MWh LiFePO4 battery storage, automated diesel-hybrid synchronization, and cloud-monitored telemetry dashboard.',
    challenge: 'Unstable utility grid with up to 18 hours of daily outage causing costly factory downtimes and high diesel generator operating expenditures.',
    solution: 'Designed and deployed a smart hybrid microgrid with automatic bus-tie transfer switch, sub-second failover, and peak-shaving inverter controls.',
    impactMetrics: ['450 kWp Microgrid Capacity', '68% Fuel Expense Reduction', '99.98% Power Uptime SLA', '410 Metric Tons CO2 Avoided/Yr'],
    liveUrl: 'https://greatstargem.com/showcase/solar-microgrid',
    githubUrl: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    status: 'published'
  },
  {
    id: 'proj-2',
    title: 'Enterprise ERP & Multi-Branch Inventory Suite',
    category: 'web-application',
    categoryName: 'Web Applications',
    location: 'Lagos & Port Harcourt, Nigeria',
    year: '2025',
    client: 'Apex Trans-West Africa Logistics Ltd',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    summary: 'Cloud-native multi-tenant Enterprise Resource Planning web application with offline-first point-of-sale synchronization, automated procurement workflows, and real-time inventory ledger across 14 warehouse depots.',
    challenge: 'Siloed branch operations and delayed stock reconciliation causing frequent inventory shrinkage and uncoordinated customer fulfillments.',
    solution: 'Engineered a modern TypeScript/React + PostgreSQL ERP featuring sub-second global search, role-based branch auditing, and automated purchase approval pipelines.',
    impactMetrics: ['14 Depots Connected', '94% Faster Stock Reconciliations', '4.2x Transaction Throughput', 'Zero Data Discrepancy'],
    liveUrl: 'https://greatstargem.com/showcase/enterprise-erp',
    githubUrl: 'https://github.com/greatstargem/enterprise-erp-core',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    status: 'published'
  },
  {
    id: 'proj-3',
    title: 'Cross-Platform Smart Logistics & Cargo Dispatch Mobile App',
    category: 'mobile-app',
    categoryName: 'Mobile Applications',
    location: 'Regional West Africa Corridor',
    year: '2024',
    client: 'SwiftWay Freight & Heavy Haulage',
    image: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=800&q=80',
    summary: 'Native-feel Flutter mobile application for fleet dispatchers, long-haul drivers, and cargo owners with real-time GPS waybill tracking, offline digital signatures, and automated SMS milestone alerts.',
    challenge: 'Lack of end-to-end visibility on long-haul transit times and manual paper manifest processing resulting in customer disputes.',
    solution: 'Delivered an intuitive mobile app featuring offline trip logging, geofenced checkpoint validations, and push notifications for customs clearance status.',
    impactMetrics: ['12,000+ Monthly Waybills', '35% Reduced Turnaround Delay', '4.8/5 Star Driver Adoption', '100% Paperless Manifests'],
    liveUrl: 'https://greatstargem.com/showcase/logistics-mobile',
    githubUrl: 'https://github.com/greatstargem/logistics-dispatch-app',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    status: 'published'
  },
  {
    id: 'proj-4',
    title: 'Campus-Wide Structured Fiber Optic & CCTV Surveillance',
    category: 'cctv-intercom',
    categoryName: 'CCTV & Intercom Installation',
    location: 'Enugu, Nigeria',
    year: '2024',
    client: 'St. Augustine International University Campus',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    summary: 'Turnkey optical backbone deployment featuring 8.5 km armored single-mode fiber, 180+ 4K AI-powered IP cameras with optical zoom, centralized SOC monitoring wall, and high-availability digital IP intercom terminals.',
    challenge: 'Large 42-hectare educational campus with blind spots, vulnerable perimeter lines, and disjointed analog communication.',
    solution: 'Built a resilient ring-topology fiber optic network with redundant power backups, license plate recognition at gates, and unified intercom communication across all faculty blocks.',
    impactMetrics: ['180+ 4K Security Nodes', '8.5 km Fiber Infrastructure', '0 Blind Spots on Perimeter', '100% Campus SOC Coverage'],
    liveUrl: 'https://greatstargem.com/showcase/campus-fiber-cctv',
    githubUrl: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    status: 'published'
  }
];

const TESTIMONIALS = [
  {
    id: 'test-1',
    name: 'Engr. Babatunde Adeyemi',
    role: 'Director of Infrastructure & Plant Operations',
    organization: 'Apex Agro-Industrial Processing Ltd, Abuja',
    country: 'Nigeria',
    serviceCategory: 'renewable-energy',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    rating: 5,
    quote: 'Great Star Gem Enterprise transformed our factory energy operations with a 450 kWp hybrid solar microgrid. Our monthly diesel expenditures dropped by 68% within the first quarter, and zero downtime has been recorded across critical cold-storage lines.'
  },
  {
    id: 'test-2',
    name: 'Dr. (Mrs.) Ifeoma Okonkwo',
    role: 'Vice Chancellor & Provost',
    organization: 'St. Augustine International University Campus, Enugu',
    country: 'Nigeria',
    serviceCategory: 'cctv-intercom',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    rating: 5,
    quote: 'The security transformation delivered by Great Star Gem across our 42-hectare campus is world-class. From the 8.5 km fiber-optic backbone to 180 AI surveillance cameras and digital intercoms, our students and faculty have never felt safer.'
  },
  {
    id: 'test-3',
    name: 'Alhaji Musa Danjuma',
    role: 'Chief Technology Officer',
    organization: 'Trans-West Freight Logistics Corridors Ltd, Lagos',
    country: 'Nigeria',
    serviceCategory: 'web-application',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    rating: 5,
    quote: 'Their engineering team built our enterprise logistics ERP and fleet driver mobile apps flawlessly. Reconciling inventory across 14 multi-state warehouses now happens in real time with sub-second accuracy.'
  }
];

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    for (const p of PROJECTS) {
      await pool.query(`
        INSERT INTO "Project" (
          id, title, category, "categoryName", location, year, client, image, summary,
          challenge, solution, "impactMetrics", "liveUrl", "githubUrl", "videoUrl", status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          "videoUrl" = EXCLUDED."videoUrl",
          "updatedAt" = CURRENT_TIMESTAMP;
      `, [
        p.id, p.title, p.category, p.categoryName, p.location, p.year, p.client,
        p.image, p.summary, p.challenge, p.solution, p.impactMetrics, p.liveUrl,
        p.githubUrl, p.videoUrl, p.status
      ]);
    }

    for (const t of TESTIMONIALS) {
      await pool.query(`
        INSERT INTO "Testimonial" (
          id, name, role, organization, country, "serviceCategory", avatar, rating, quote, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          organization = EXCLUDED.organization,
          quote = EXCLUDED.quote,
          "updatedAt" = CURRENT_TIMESTAMP;
      `, [
        t.id, t.name, t.role, t.organization, t.country, t.serviceCategory, t.avatar, t.rating, t.quote
      ]);
    }

    const pRes = await pool.query('SELECT count(*)::int as c FROM "Project"');
    const tRes = await pool.query('SELECT count(*)::int as c FROM "Testimonial"');
    console.log(`Database populated successfully: ${pRes.rows[0].c} projects, ${tRes.rows[0].c} testimonials.`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await pool.end();
  }
}

main();
