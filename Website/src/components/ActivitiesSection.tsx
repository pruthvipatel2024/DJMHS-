import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Translations } from '../translations';

interface ActivitiesSectionProps {
  t: Translations;
}

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({ t }) => {
  return (
    <section id="activities" className="py-20 lg:py-28 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Heading */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-28">
            <div className="text-xs font-bold uppercase tracking-widest text-[#A47E1B]">
              {t.activities.tag}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-slate-900 leading-[1.15] tracking-tight">
              {t.activities.title}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed pt-2">
              Co-curricular activities, team athletics, and cultural arts form an integral pillar of our student life, building teamwork, resilience, and creative expression.
            </p>
          </div>

          {/* Right Column: Numbered Interactive Activity Rows */}
          <div className="lg:col-span-7 divide-y divide-slate-200">
            {t.activities.items.map((item) => (
              <div
                key={item.num}
                className="py-8 first:pt-0 last:pb-0 group cursor-pointer transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {item.num}
                    </span>
                    <h3 className="font-display text-2xl sm:text-3xl font-normal text-slate-900 group-hover:text-[#A47E1B] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
                      {item.desc}
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-full border border-slate-200 group-hover:border-[#0B192C] group-hover:bg-[#0B192C] group-hover:text-white flex items-center justify-center shrink-0 transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
