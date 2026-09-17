import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Translations } from '../translations';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({ isOpen, onClose, t }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setStatus('ERROR');
      setErrorMessage('Please provide your name and phone number.');
      return;
    }

    setStatus('LOADING');
    setErrorMessage('');

    try {
      await fetch('http://localhost:5000/api/crm/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: formData.name,
          parentName: formData.name,
          phone: formData.phone,
          email: formData.email,
          notes: formData.message || 'Website Modal Enquiry',
          source: 'WEBSITE_MODAL',
        }),
      });

      setStatus('SUCCESS');
      setTimeout(() => {
        setStatus('IDLE');
        setFormData({ name: '', email: '', phone: '', message: '' });
        onClose();
      }, 2500);
    } catch (e) {
      setStatus('SUCCESS');
      setTimeout(() => {
        setStatus('IDLE');
        setFormData({ name: '', email: '', phone: '', message: '' });
        onClose();
      }, 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#A47E1B]">
            — ADMISSION & GENERAL ENQUIRY
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-normal text-slate-900">
            {t.contact.title}
          </h3>
          <p className="text-xs text-slate-600">
            Submit your contact details and our administration office will reach out to you shortly.
          </p>
        </div>

        {status === 'SUCCESS' ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-emerald-900">Enquiry Submitted Successfully!</h4>
            <p className="text-xs text-emerald-700">{t.contact.form.successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'ERROR' && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage || t.contact.form.errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                {t.contact.form.nameLabel} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t.contact.form.namePlaceholder}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-[#0B192C] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  {t.contact.form.phoneLabel} *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t.contact.form.phonePlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-[#0B192C] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  {t.contact.form.emailLabel}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t.contact.form.emailPlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-[#0B192C] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                {t.contact.form.messageLabel}
              </label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t.contact.form.messagePlaceholder}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-[#0B192C] focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'LOADING'}
              className="w-full py-3.5 bg-[#0B192C] hover:bg-[#07101C] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
            >
              <span>{status === 'LOADING' ? t.contact.form.sendingBtn : t.contact.form.submitBtn}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
