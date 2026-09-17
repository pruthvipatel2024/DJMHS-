import React from 'react';
import { ArrowUpRight, Instagram, Shield } from 'lucide-react';
import { Translations } from '../translations';

interface FooterProps {
  t: Translations;
}

export const Footer: React.FC<FooterProps> = ({ t }) => {
  return (
    <footer className="bg-[#07101C] text-slate-300 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
          
          {/* Brand & Mission Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 border border-white/30 rounded flex items-center justify-center font-display text-2xl font-bold text-white">
                S
              </div>
              <div>
                <span className="font-display font-bold text-white text-lg tracking-tight block leading-none">
                  {t.nav.brandName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4C3A3] mt-1 block leading-none">
                  {t.nav.brandSub}
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              {t.footer.schoolDesc}
            </p>

            <div className="pt-2">
              <a
                href="http://localhost:5173/login"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors group"
              >
                <Shield className="w-3.5 h-3.5 text-[#D4C3A3]" />
                <span>{t.footer.portalBtn}</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Explore Links */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              {t.footer.exploreTitle}
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  {t.nav.about}
                </a>
              </li>
              <li>
                <a href="#academics" className="hover:text-white transition-colors">
                  {t.nav.academics}
                </a>
              </li>
              <li>
                <a href="#campus" className="hover:text-white transition-colors">
                  {t.nav.campusLife}
                </a>
              </li>
              <li>
                <a href="#activities" className="hover:text-white transition-colors">
                  {t.nav.activities}
                </a>
              </li>
              <li>
                <a href="#achievements" className="hover:text-white transition-colors">
                  {t.nav.achievements}
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-white transition-colors">
                  {t.nav.gallery}
                </a>
              </li>
              <li>
                <a href="#news" className="hover:text-white transition-colors">
                  {t.nav.newsEvents}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Location Info */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              {t.footer.contactTitle}
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="text-slate-300 font-medium">{t.contact.addressVal}</p>
              <p>Phone: {t.contact.phoneVal}</p>
              <p>Email: {t.contact.emailVal}</p>
            </div>

            <div className="pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#D4C3A3] hover:text-white transition-colors"
              >
                <Instagram className="w-4 h-4" />
                <span>@shreedjmahetahighschool</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-12 mt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div>{t.footer.copyright}</div>
          <div className="text-[#D4C3A3] font-bold">{t.footer.locationBadge}</div>
        </div>
      </div>
    </footer>
  );
};
