import React from 'react';
import { ArrowUpRight, Instagram } from 'lucide-react';
import { Translations } from '../translations';

interface SharedJourneyProps {
  t: Translations;
  onOpenEnquire: () => void;
}

export const SharedJourney: React.FC<SharedJourneyProps> = ({ t, onOpenEnquire }) => {
  const socialImages = [
    { src: '/images/school_photo_7.jpg', caption: 'Campus Courtyard' },
    { src: '/images/school_photo_2.jpg', caption: 'Morning School Routine' },
    { src: '/images/school_photo_3.jpg', caption: 'Traditional Cultural Fest' },
    { src: '/images/school_photo_4.jpg', caption: 'Sports Meet' },
  ];

  return (
    <section className="py-20 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Warm Ochre / Sand Accent Callout Banner */}
        <div className="bg-[#EAE0D0] rounded-3xl p-8 sm:p-14 border border-[#D4C3A3] flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#866412]">
              {t.sharedJourney.tag}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal text-slate-950 leading-[1.15] tracking-tight">
              {t.sharedJourney.title}
            </h2>
            <p className="text-slate-800 text-sm sm:text-base leading-relaxed pt-1">
              {t.sharedJourney.desc}
            </p>
          </div>

          <button
            onClick={onOpenEnquire}
            className="px-6 py-3.5 bg-[#0B192C] hover:bg-[#07101C] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all shadow-md group shrink-0 cursor-pointer"
          >
            <span>{t.sharedJourney.connectBtn}</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Social Feed: @shreedjmahetahighschool */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-slate-200">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#A47E1B]">
                {t.sharedJourney.followTag}
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-normal text-slate-900 mt-1 flex items-center gap-3">
                <Instagram className="w-7 h-7 text-pink-600" />
                {t.sharedJourney.handle}
              </h3>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-[#A47E1B] transition-colors group"
            >
              <span>{t.sharedJourney.followLink}</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8">
            {socialImages.map((img, i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden shadow-sm aspect-square bg-slate-100 border border-slate-200"
              >
                <img
                  src={img.src}
                  alt={img.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 text-center">
                  <span className="text-white text-xs font-bold tracking-wide">
                    {img.caption}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
