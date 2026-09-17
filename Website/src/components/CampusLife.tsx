import React from 'react';
import { Translations } from '../translations';

interface CampusLifeProps {
  t: Translations;
}

export const CampusLife: React.FC<CampusLifeProps> = ({ t }) => {
  return (
    <section id="campus" className="py-20 lg:py-28 bg-[#FAF8F5] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-12">
          <div className="lg:col-span-6 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-[#A47E1B]">
              {t.campus.tag}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-slate-900 leading-[1.15] tracking-tight">
              {t.campus.title}
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t.campus.subtitle}
            </p>
          </div>
        </div>

        {/* Asymmetric Editorial Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Large Left Card: Campus Exterior & Grounds */}
          <div className="lg:col-span-7 relative group rounded-2xl overflow-hidden shadow-lg h-[340px] sm:h-[480px] bg-slate-900">
            <img
              src="/images/school_photo_7.jpg"
              alt="School Campus and Courtyard"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#0B192C] font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
                {t.campus.badge1}
              </span>
            </div>
          </div>

          {/* Right Column Stack: Library & Learning Labs */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {/* Top Right: Library & Knowledge Hub */}
            <div className="relative group rounded-2xl overflow-hidden shadow-lg h-[230px] bg-slate-900">
              <img
                src="/images/school_photo_5.jpg"
                alt="School Library and Reading Room"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#0B192C] font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
                  {t.campus.badge2}
                </span>
              </div>
            </div>

            {/* Bottom Right: Classroom & Science Labs */}
            <div className="relative group rounded-2xl overflow-hidden shadow-lg h-[230px] bg-slate-900">
              <img
                src="/images/school_photo_6.jpg"
                alt="Classroom and Interactive Learning"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#0B192C] font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
                  {t.campus.badge3}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
