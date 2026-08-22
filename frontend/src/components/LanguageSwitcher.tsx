import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 p-1.5 pl-3 rounded-xl border transition ${isOpen ? 'bg-slate-50 border-slate-300' : 'border-slate-200 hover:bg-slate-50'}`}
      >
        <Globe className="w-4 h-4 text-slate-600" />
        <span className="text-xs font-bold text-slate-800 uppercase leading-tight mr-1">
          {i18n.language || 'en'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-100 origin-top-right">
          <button
            onClick={() => changeLanguage('en')}
            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
              i18n.language === 'en' ? 'text-primary-600 font-bold bg-primary-50/50' : 'text-slate-700 font-medium'
            }`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('gu')}
            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
              i18n.language === 'gu' ? 'text-primary-600 font-bold bg-primary-50/50' : 'text-slate-700 font-medium'
            }`}
          >
            ગુજરાતી (Gujarati)
          </button>
          <button
            onClick={() => changeLanguage('hi')}
            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
              i18n.language === 'hi' ? 'text-primary-600 font-bold bg-primary-50/50' : 'text-slate-700 font-medium'
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
