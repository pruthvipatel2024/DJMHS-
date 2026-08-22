import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable/DataTable';
import api from '../../services/api';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import CrmService from '../../services/crm.service';

const ComplaintsPage: React.FC = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await CrmService.getComplaints();
      setTickets(data);
    } catch (e) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await api.put(`/crm/complaints/${id}`, { status: 'RESOLVED', resolutionNotes: 'Issue fully investigated and corrected by administrative committee.' });
      setToastMsg('Complaint ticket resolved successfully! Notification dispatched to ticket originator.');
      fetchTickets();
    } catch (e: any) {
      setToastMsg(e.response?.data?.message || 'Failed to update complaint ticket status.');
    }
    setTimeout(() => setToastMsg(null), 5000);
  };

  const columns: Column<any>[] = [
    {
      header: t('grievance_category'),
      accessor: (row) => (
        <div className="space-y-1">
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 text-[10px] font-extrabold uppercase">{row.category}</span>
          <div className="font-black text-slate-900 text-sm mt-0.5">{row.title}</div>
          <div className="text-xs text-slate-500 font-medium line-clamp-2 max-w-md">{row.description}</div>
        </div>
      ),
    },
    {
      header: t('originator_priority'),
      accessor: (row) => (
        <div className="space-y-1">
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${row.priority === 'URGENT' || row.priority === 'HIGH' ? 'bg-red-100 text-red-800 font-black' : 'bg-slate-100 text-slate-700'}`}>
            Priority: {row.priority}
          </span>
          <div className="text-xs font-bold text-slate-700">Source: {row.submittedByType}</div>
          <div className="text-[11px] text-slate-400">Logged: {new Date(row.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: t('sla_status'),
      accessor: (row) => {
        const colors: Record<string, string> = {
          OPEN: 'bg-red-100 text-red-800 border-red-200 font-black animate-pulse',
          IN_REVIEW: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
          RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold',
        };
        return <span className={`px-3 py-1 rounded-xl text-xs border inline-block ${colors[row.status] || 'bg-slate-100 text-slate-700'}`}>{row.status}</span>;
      },
      sortable: true,
    },
    {
      header: t('admin_resolution'),
      accessor: (row) => {
        if (row.status === 'RESOLVED') {
          return <span className="text-emerald-700 font-extrabold text-xs flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {t('ticket_closed')}</span>;
        }
        return (
          <button
            onClick={() => handleResolve(row.id)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition"
          >
            {t('mark_resolved')}
          </button>
        );
      },
    },
  ];

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {toastMsg}
        </div>
      )}

      {/* Control Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded border border-amber-300">
            <MessageSquare className="w-3.5 h-3.5 inline mr-1" /> {t('helpdesk_tag')}
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{t('complaint_desk_title')}</h2>
          <p className="text-xs text-slate-500">{t('complaint_desk_subtitle')}</p>
        </div>

        <button
          onClick={() => alert('Opening Ticket Creation Modal...')}
          className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/30 transition self-end md:self-auto"
        >
          {t('log_internal_ticket')}
        </button>
      </div>

      <DataTable
        title={t('ticket_directory_title')}
        subtitle={t('ticket_directory_subtitle')}
        data={tickets}
        columns={columns}
        searchPlaceholder={t('search_complaint_placeholder')}
      />

    </div>
  );
};

export default ComplaintsPage;
