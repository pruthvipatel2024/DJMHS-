import React from 'react';
import { ArrowUpRight, Calendar, Tag } from 'lucide-react';
import { Translations } from '../translations';

interface NewsSectionProps {
  t: Translations;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ t }) => {
  return (
    <section id="news" className="py-20 lg:py-28 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-12 border-b border-slate-200">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-[#A47E1B]">
              {t.news.tag}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-slate-900 leading-[1.15] tracking-tight">
              {t.news.title}
            </h2>
          </div>
          <a
            href="#contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-[#A47E1B] transition-colors group"
          >
            <span>{t.news.viewAll}</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* 3 News / Events Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {t.news.items.map((item, idx) => (
            <div
              key={idx}
              className="group p-6 sm:p-8 rounded-2xl border border-slate-200/90 bg-[#FAF8F5] hover:bg-white hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded bg-[#0B192C] text-white uppercase tracking-wider text-[10px]">
                    {item.category}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.date}
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-normal text-slate-900 group-hover:text-[#A47E1B] transition-colors">
                  {item.title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-[#A47E1B]">
                <span>Read Full Announcement</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
