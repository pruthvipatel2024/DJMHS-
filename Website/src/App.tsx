import React, { useState, useEffect } from 'react';
import { Language, translations } from './translations';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Introduction } from './components/Introduction';
import { AboutSection } from './components/AboutSection';
import { AcademicsSection } from './components/AcademicsSection';
import { CampusLife } from './components/CampusLife';
import { ActivitiesSection } from './components/ActivitiesSection';
import { AchievementsSection } from './components/AchievementsSection';
import { NewsSection } from './components/NewsSection';
import { GallerySection } from './components/GallerySection';
import { SharedJourney } from './components/SharedJourney';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { EnquiryModal } from './components/EnquiryModal';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    // Set html lang attribute and class for typography
    document.documentElement.lang = lang;
    document.documentElement.className = `scroll-smooth lang-${lang}`;
  }, [lang]);

  return (
    <div className={`min-h-screen flex flex-col font-sans bg-[#FAF8F5] text-slate-900 lang-${lang}`}>
      {/* 1. Header & Navigation */}
      <Navbar
        lang={lang}
        setLang={setLang}
        t={t}
        onOpenEnquire={() => setEnquiryModalOpen(true)}
      />

      {/* Main Page Sections matching reference design video */}
      <main className="flex-grow">
        {/* 2. Hero Section */}
        <Hero
          t={t}
          onOpenEnquire={() => setEnquiryModalOpen(true)}
        />

        {/* 3. Introduction & Core Values Strip */}
        <Introduction t={t} />

        {/* 4. About The School (4 Narrative Pillars) */}
        <AboutSection t={t} />

        {/* 5. Academics Section (Deep Navy) */}
        <AcademicsSection t={t} />

        {/* 6. Campus Life (Bento Photo Grid) */}
        <CampusLife t={t} />

        {/* 7. Activities & Student Life */}
        <ActivitiesSection t={t} />

        {/* 8. Achievements Showcase */}
        <AchievementsSection t={t} />

        {/* 9. News & Events */}
        <NewsSection t={t} />

        {/* 10. Photo Gallery (Filterable + Lightbox) */}
        <GallerySection t={t} />

        {/* 11. Shared Journey & Social Feed */}
        <SharedJourney
          t={t}
          onOpenEnquire={() => setEnquiryModalOpen(true)}
        />

        {/* 12. Contact & Live Admission Enquiry Form (Deep Navy) */}
        <ContactSection t={t} />
      </main>

      {/* 13. Institutional Footer */}
      <Footer t={t} />

      {/* Quick Admission Enquiry Modal */}
      <EnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        t={t}
      />
    </div>
  );
};

export default App;
