import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Menu, X, Globe } from 'lucide-react';
import { Language, Translations } from '../translations';

interface NavbarProps {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
  onOpenEnquire: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ lang, setLang, t, onOpenEnquire }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: t.nav.about, href: '#about' },
    { label: t.nav.academics, href: '#academics' },
    { label: t.nav.campusLife, href: '#campus' },
    { label: t.nav.activities, href: '#activities' },
    { label: t.nav.achievements, href: '#achievements' },
    { label: t.nav.gallery, href: '#gallery' },
    { label: t.nav.newsEvents, href: '#news' },
    { label: t.nav.contact, href: '#contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-3.5 border-b border-slate-200/80'
            : 'bg-white py-5 border-b border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Monogram & Title */}
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 border border-slate-300 rounded-sm flex items-center justify-center font-display text-xl font-bold text-slate-900 group-hover:border-slate-900 transition-colors">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-none">
                {t.nav.brandName}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1 leading-none">
                {t.nav.brandSub}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-6 text-[11px] font-bold tracking-wider text-slate-600">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-slate-950 transition-colors uppercase py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Controls: Language Selector + Enquire CTA */}
          <div className="hidden sm:flex items-center space-x-4">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-md text-[11px] font-bold border border-slate-200">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'en'
                    ? 'bg-white text-slate-950 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('gu')}
                className={`px-2.5 py-1 rounded font-gujarati transition-colors ${
                  lang === 'gu'
                    ? 'bg-white text-slate-950 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ગુજરાતી
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded font-hindi transition-colors ${
                  lang === 'hi'
                    ? 'bg-white text-slate-950 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Enquire Now CTA Button */}
            <button
              onClick={onOpenEnquire}
              className="px-4 py-2.5 bg-[#0B192C] hover:bg-[#07101C] text-white text-xs font-bold tracking-wider uppercase rounded flex items-center gap-1.5 transition-all shadow-xs group cursor-pointer"
            >
              <span>{t.nav.enquireNow}</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-slate-700 hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 border border-slate-300 rounded flex items-center justify-center font-display font-bold text-slate-900">
                    S
                  </div>
                  <span className="font-display font-bold text-slate-900 text-xs">
                    {t.nav.brandName}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Language Switcher in Mobile Drawer */}
              <div className="mt-5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Select Language
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold text-center">
                  <button
                    onClick={() => setLang('en')}
                    className={`py-1.5 rounded ${lang === 'en' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLang('gu')}
                    className={`py-1.5 rounded font-gujarati ${lang === 'gu' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'}`}
                  >
                    ગુજરાતી
                  </button>
                  <button
                    onClick={() => setLang('hi')}
                    className={`py-1.5 rounded font-hindi ${lang === 'hi' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'}`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="mt-6 flex flex-col space-y-3.5">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-bold text-slate-800 hover:text-[#0B192C] py-1 border-b border-slate-100"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Bottom Enquire Button */}
            <div className="pt-6 border-t border-slate-200 mt-6">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenEnquire();
                }}
                className="w-full py-3 bg-[#0B192C] text-white text-xs font-bold tracking-wider uppercase rounded flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>{t.nav.enquireNow}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
