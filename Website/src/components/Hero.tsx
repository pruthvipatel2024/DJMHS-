import React from 'react';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { Translations } from '../translations';

interface HeroProps {
  t: Translations;
  onOpenEnquire: () => void;
}

export const Hero: React.FC<HeroProps> = ({ t, onOpenEnquire }) => {
  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-slate-900">
      {/* Hero Background Image with Editorial Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/school_photo_1.jpg"
          alt="Shree Dhaneshkumar Jasvantlal Maheta High School Campus"
          className="w-full h-full object-cover object-center opacity-45 scale-105 animate-pulse duration-1000"
          style={{ animationDuration: '8s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C] via-[#0B192C]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B192C]/80 via-transparent to-[#0B192C]/40" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl space-y-6 sm:space-y-8">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#D4C3A3]">
            <span>{t.hero.tag}</span>
          </div>

          {/* Main Editorial Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-normal text-white leading-[1.1] tracking-tight">
            {t.hero.title}
          </h1>

          {/* Subtitle Body Text */}
          <p className="text-base sm:text-xl text-slate-200 font-normal leading-relaxed max-w-2xl">
            {t.hero.subtitle}
          </p>

          {/* Dual Call-to-Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#about"
              className="px-6 py-3.5 bg-[#D4C3A3] hover:bg-[#C5A880] text-[#0B192C] font-bold text-xs uppercase tracking-wider rounded flex items-center gap-2 transition-all shadow-md group cursor-pointer"
            >
              <span>{t.hero.discoverBtn}</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <a
              href="#contact"
              className="px-6 py-3.5 bg-transparent hover:bg-white/10 text-white border border-white/40 font-bold text-xs uppercase tracking-wider rounded flex items-center gap-2 transition-all group cursor-pointer"
            >
              <span>{t.hero.getInTouchBtn}</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <div className="absolute bottom-6 left-4 sm:left-8 z-10 hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
        <span>{t.hero.scrollExplore}</span>
        <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
      </div>
    </section>
  );
};
