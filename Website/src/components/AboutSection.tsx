import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Translations } from '../translations';

interface AboutSectionProps {
  t: Translations;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ t }) => {
  return (
    <section id="pillars" className="py-20 lg:py-28 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-12 border-b border-slate-200">
          <div className="lg:col-span-6 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-[#A47E1B]">
              {t.about.tag}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-slate-900 leading-[1.15] tracking-tight">
              {t.about.title}
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t.about.subtitle}
            </p>
          </div>
        </div>

        {/* 4 Narrative Pillars (Story, Vision, Mission, Values) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {t.about.pillars.map((pillar, idx) => {
            // Pick appropriate images
            const images = [
              '/images/school_photo_1.jpg',
              '/images/school_photo_3.jpg',
              '/images/school_photo_5.jpg',
              '/images/school_photo_7.jpg',
            ];
            const displayImg = images[idx] || pillar.image;

            return (
              <div
                key={pillar.num}
                className="group flex flex-col justify-between space-y-4 pt-2 border-t-2 border-slate-900 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
                    <span>{pillar.num}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#A47E1B]" />
                  </div>
                  <h3 className="font-display text-2xl font-normal text-slate-900 mb-2.5">
                    {pillar.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>

                <div className="overflow-hidden rounded-xl h-44 bg-slate-100 mt-4">
                  <img
                    src={displayImg}
                    alt={pillar.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
