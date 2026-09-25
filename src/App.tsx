import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import ProjectsSection from './components/ProjectsSection';
import TestimonialsSection from './components/TestimonialsSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ServiceDetailModal from './components/ServiceDetailModal';
import ProjectDetailModal from './components/ProjectDetailModal';
import AdminPage from './components/admin/AdminPage';
import { DataProvider, useData } from './context/DataContext';
import { ServiceItem, ProjectItem, ServiceCategory } from './types';

function PublicWebsite() {
  // Modal states
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<ServiceItem | null>(null);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<ProjectItem | null>(null);
  
  // Pre-selected service for contact form
  const [contactPreselectedService, setContactPreselectedService] = useState<ServiceCategory | ''>('');

  const handleSelectServiceForContact = (serviceId: string) => {
    setContactPreselectedService(serviceId as ServiceCategory);
    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /* [UNUSED - Candidate for removal]:
  const handleOpenConsultation = () => {
    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactElement.scrollIntoView({ behavior: 'smooth' });
    }
  };
  */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Sticky Top Navigation */}
      <Navbar /* [UNUSED - Candidate for removal]: onOpenConsultation={handleOpenConsultation} */ />

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* Hero Section (#home) */}
        <Hero /* [UNUSED - Candidate for removal]: onSelectServiceTab={handleSelectServiceForContact} */ />

        {/* About Section (#about) */}
        <AboutSection />

        {/* Services Section (#services) */}
        <ServicesSection 
          onOpenServiceModal={(service) => setSelectedServiceForModal(service)}
          onSelectServiceForContact={handleSelectServiceForContact}
        />

        {/* Projects Section (#projects) */}
        <ProjectsSection 
          onOpenProjectModal={(project) => setSelectedProjectForModal(project)}
        />

        {/* Testimonials Section (#testimonials) */}
        <TestimonialsSection />

        {/* Contact Section (#contact) */}
        <ContactSection initialService={contactPreselectedService} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Detail Modals */}
      <ServiceDetailModal
        service={selectedServiceForModal}
        onClose={() => setSelectedServiceForModal(null)}
        onInquire={handleSelectServiceForContact}
      />

      <ProjectDetailModal
        project={selectedProjectForModal}
        onClose={() => setSelectedProjectForModal(null)}
        onInquire={handleSelectServiceForContact}
      />
    </div>
  );
}

function MainRouting() {
  const { currentRoute } = useData();

  if (currentRoute === 'admin') {
    return <AdminPage />;
  }

  return <PublicWebsite />;
}

export default function App() {
  return (
    <DataProvider>
      <MainRouting />
    </DataProvider>
  );
}
