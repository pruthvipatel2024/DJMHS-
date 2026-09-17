import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Translations } from '../translations';

interface IntroductionProps {
  t: Translations;
}

export const Introduction: React.FC<IntroductionProps> = ({ t }) => {
  return (
    <section id="about" className="py-20 lg:py-28 bg-[#FAF8F5] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Featured Student Portrait */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-100 group">
              <img
                src="/images/school_photo_2.jpg"
                alt="Students at Shree Dhaneshkumar Jasvantlal Maheta High School"
                className="w-full h-[420px] sm:h-[480px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>AUTHENTIC STUDENT LIFE</span>
                <span className="text-[#0B192C]">EST. 1959</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#A47E1B]">
              {t.intro.tag}
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-normal text-slate-900 leading-[1.15] tracking-tight">
              {t.intro.title}
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
              {t.intro.desc}
            </p>

            <div className="pt-2">
              <a
                href="#pillars"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-950 border-b-2 border-slate-950 pb-1 hover:text-[#A47E1B] hover:border-[#A47E1B] transition-colors group"
              >
                <span>{t.intro.discoverStoryBtn}</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Numbered Core Values Strip (01 Learning | 02 Character | ...) */}
        <div className="mt-20 pt-10 border-t border-slate-200">
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-6">
            — WHAT WE HOLD CLOSE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {t.intro.values.map((v) => (
              <div key={v.num} className="border-t border-slate-300 pt-3">
                <span className="text-xs font-bold text-slate-400">{v.num}</span>
                <h4 className="font-display text-lg sm:text-xl font-normal text-slate-900 mt-1">
                  {v.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
