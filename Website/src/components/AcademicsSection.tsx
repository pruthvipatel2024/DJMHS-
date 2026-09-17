import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Translations } from '../translations';

interface AcademicsSectionProps {
  t: Translations;
}

export const AcademicsSection: React.FC<AcademicsSectionProps> = ({ t }) => {
  return (
    <section id="academics" className="py-20 lg:py-28 bg-[#0B192C] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Title & Section Tag */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#D4C3A3]">
              {t.academics.tag}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-normal text-white leading-[1.1] tracking-tight">
              {t.academics.title}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-2 max-w-md">
              Our curriculum blends GSEB state board excellence with rigorous academic coaching, practical science laboratory training, and commerce foundational skills.
            </p>
          </div>

          {/* Right Column: 2x2 Bento Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {t.academics.cards.map((card) => (
              <div
                key={card.num}
                className="p-6 sm:p-8 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xs hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#D4C3A3] mb-3">
                    <span>{card.num}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-[#D4C3A3]" />
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-normal text-white mb-2.5">
                    {card.title}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
