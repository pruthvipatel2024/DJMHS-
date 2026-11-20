import React from 'react';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { Translations } from '../translations';

interface HeroProps {
  t: Translations;
  onOpenEnquire: () => void;
}

export const Hero: React.FC<HeroProps> = ({ t, onOpenEnquire }) => {
  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-[#0B192C]">
      {/* Hero Background Image - Principal (Clear, Clean, and Uncropped) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Soft ambient backdrop to seamlessly fill widescreen edges */}
        <img
          src="/images/Principal.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25"
        />

        {/* Crisp uncropped main image */}
        <img
          src="/images/Principal.jpg"
          alt="Shree Dhaneshkumar Jasvantlal Maheta High School"
          className="relative w-full h-full object-contain object-center lg:object-right opacity-95 drop-shadow-xl"
        />

        {/* Directional gradient overlay: keeps text perfectly readable on the left while keeping the photo crisp & clean on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B192C] via-[#0B192C]/85 via-40% to-transparent pointer-events-none hidden lg:block" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B192C]/90 via-[#0B192C]/70 to-[#0B192C]/90 pointer-events-none lg:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0B192C] to-transparent pointer-events-none" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl lg:max-w-xl space-y-6 sm:space-y-8">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#D4C3A3] drop-shadow-sm">
            <span>{t.hero.tag}</span>
          </div>

          {/* Main Editorial Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-normal text-white leading-[1.1] tracking-tight drop-shadow-md">
            {t.hero.title}
          </h1>

          {/* Subtitle Body Text */}
          <p className="text-base sm:text-xl text-slate-100 font-normal leading-relaxed max-w-2xl drop-shadow-sm">
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
