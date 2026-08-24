import React, { useState, useEffect } from 'react';
import { Send, Megaphone, CheckCircle2, AlertTriangle, Users, Calendar } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable/DataTable';
import api from '../../services/api';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import CrmService from '../../services/crm.service';
import { useAuth } from '../auth/AuthContext';

const AnnouncementsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');
  const isStaff = userRole === 'ADMIN' || userRole === 'TEACHER';

  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [sendSMSAlert, setSendSMSAlert] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchCirculars = async () => {
    setLoading(true);
    try {
      const data = await CrmService.getAnnouncements();
      setNotices(data);
    } catch (e) {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculars();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);
    try {
      await api.post('/crm/announcements', { title, content, targetAudience, sendSMSAlert });
      setToastMsg(`Circular "${title}" published across institutional portals! ${sendSMSAlert ? 'SMS broadcast alert fired.' : ''}`);
    } catch (e: any) {
      setToastMsg(e.response?.data?.message || 'Failed to publish circular notice. Please try again.');
    } finally {
      setSubmitting(false);
      setTitle('');
      setContent('');
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Circular Description & Content',
      accessor: (row) => (
        <div className="space-y-1">
          <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <span>{row.title}</span>
            {row.isUrgent && <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-extrabold text-[10px]">URGENT</span>}
          </div>
          <div className="text-xs text-slate-600 leading-relaxed font-medium">{row.content}</div>
        </div>
      ),
    },
    {
      header: 'Target Portal Audience',
      accessor: (row) => (
        <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-900 font-black text-xs border border-indigo-200 inline-flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          {row.targetAudience}
        </span>
      ),
    },
    {
      header: 'Broadcast Date',
      accessor: (row) => (
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {new Date(row.publishDate).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> {toastMsg}
        </div>
      )}

      {/* Broadcast Form Panel (Staff Only) */}
      {isStaff && (
        <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 text-white rounded-2xl p-6 shadow-xl border border-primary-600 space-y-5">
          <div className="border-b border-primary-700/60 pb-3">
            <span className="text-[10px] font-black uppercase bg-accent-400 text-slate-900 px-2.5 py-0.5 rounded tracking-wider">
              <Megaphone className="w-3.5 h-3.5 inline mr-1" /> {t('broadcast_console_tag')}
            </span>
            <h2 className="text-2xl font-black text-white mt-1.5">{t('publish_notice_title')}</h2>
            <p className="text-xs text-primary-200">{t('publish_notice_subtitle')}</p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-accent-300 font-black uppercase mb-1">{t('circular_title_label')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Day Celebration & Practice Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white text-slate-900 font-extrabold text-xs focus:outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>

              <div>
                <label className="block text-accent-300 font-black uppercase mb-1">{t('target_audience_label')}</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white text-slate-900 font-black text-xs cursor-pointer focus:outline-none"
                >
                  <option value="ALL">All Portals (Staff, Parents & Students)</option>
                  <option value="TEACHER">Staff & Faculty Members Only</option>
                  <option value="STUDENT_PARENT">Students & Registered Parents Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-accent-300 font-black uppercase mb-1">{t('notice_body_label')}</label>
              <textarea
                required
                rows={3}
                placeholder="Enter comprehensive instructions for the circular..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-white text-slate-900 font-semibold text-xs focus:outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-primary-700/60">
              <label className="flex items-center gap-2 cursor-pointer select-none font-extrabold text-white text-xs">
                <input
                  type="checkbox"
                  checked={sendSMSAlert}
                  onChange={(e) => setSendSMSAlert(e.target.checked)}
                  className="w-4 h-4 rounded text-accent-500 focus:ring-accent-400"
                />
                <span>{t('trigger_sms_label')}</span>
              </label>

              <button
                type="submit"
                disabled={submitting || !title || !content}
                className="px-8 py-3 rounded-xl bg-accent-400 hover:bg-accent-500 text-slate-900 font-black text-xs transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-slate-900" />
                {submitting ? 'Broadcasting Notice...' : t('publish_circular_btn')}
              </button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        title={t('published_circular_title')}
        subtitle={t('published_circular_subtitle')}
        data={notices}
        columns={columns}
        searchPlaceholder={t('search_circular_placeholder')}
      />

    </div>
  );
};

export default AnnouncementsPage;
