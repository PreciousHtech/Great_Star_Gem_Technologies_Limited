export type ServiceCategory = 
  | 'conference' 
  | 'real-estate' 
  | 'solar' 
  | 'engineering' 
  | 'ict'
  | 'web-application'

export interface ServiceItem {
  id: ServiceCategory;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  fullDescription: string;
  iconName: string;
  image: string;
  features: string[];
  deliverables: string[];
  metrics: { label: string; value: string }[];
  badge: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: ServiceCategory;
  categoryName: string;
  location?: string;
  year: string;
  client: string;
  image: string;
  summary: string;
  challenge?: string;
  solution?: string;
  impactMetrics?: string[];
  liveUrl?: string;
  githubUrl?: string;
  videoUrl?: string;
  status?: 'published' | 'draft';
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  organization: string;
  country?: string;
  serviceCategory?: ServiceCategory;
  avatar?: string;
  rating?: number;
  quote: string;
  createdAt?: string;
}

export interface AdminSettings {
  username: string;
  email: string;
  sessionTimeoutMinutes: number;
  publicApiEnabled?: boolean;
  lastUpdated?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export interface ConsultationFormData {
  fullName: string;
  email: string;
  phone: string;
  service: ServiceCategory | '';
  projectType: string;
  estimatedTimeline: string;
  message: string;
}
