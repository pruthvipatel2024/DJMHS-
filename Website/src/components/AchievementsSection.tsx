import React from 'react';
import { Award, Trophy, GraduationCap, Users } from 'lucide-react';
import { Translations } from '../translations';

interface AchievementsSectionProps {
  t: Translations;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ t }) => {
  const icons = [Award, Trophy, GraduationCap, Users];

  return (
    <section id="achievements" className="py-20 lg:py-28 bg-[#FAF8F5] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-[#A47E1B]">
            {t.achievements.tag}
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-normal text-slate-900 leading-[1.15] tracking-tight">
            {t.achievements.title}
          </h2>
        </div>

        {/* Milestone Box & Stat Grid */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-10 border-b border-slate-200">
            <div className="lg:col-span-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#A47E1B] shrink-0">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  {t.achievements.boxTitle}
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  ESTABLISHED 1959
                </span>
              </div>
            </div>
            <div className="lg:col-span-8">
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {t.achievements.boxDesc}
              </p>
            </div>
          </div>

          {/* 4 Stat Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-10">
            {t.achievements.stats.map((st, i) => {
              const IconComponent = icons[i] || Award;
              return (
                <div key={i} className="space-y-2 border-l-2 border-[#D4C3A3] pl-4">
                  <div className="text-slate-400 mb-1">
                    <IconComponent className="w-5 h-5 text-[#A47E1B]" />
                  </div>
                  <div className="font-display text-3xl sm:text-5xl font-normal text-slate-900 tracking-tight">
                    {st.value}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-600">
                    {st.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
