import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, ShieldCheck, Plus, X, Send, Clock } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable/DataTable';
import api from '../../services/api';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import CrmService from '../../services/crm.service';
import { useAuth } from '../auth/AuthContext';

const ComplaintsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');
  const isStaff = userRole === 'ADMIN' || userRole === 'TEACHER';

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // New Complaint Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [priority, setPriority] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/crm/complaints', { title, description, category, priority });
      setToastMsg('Grievance ticket submitted to helpdesk! Tracking ticket generated.');
      setShowModal(false);
      setTitle('');
      setDescription('');
      fetchTickets();
    } catch (e: any) {
      setToastMsg(e.response?.data?.message || 'Failed to submit grievance ticket. Please try again.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

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
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 text-[10px] font-extrabold uppercase border border-indigo-200">
              {row.category?.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] font-bold text-slate-400">#{row.ticketNumber}</span>
          </div>
          <div className="font-black text-slate-900 text-sm mt-0.5">{row.title}</div>
          <div className="text-xs text-slate-600 font-medium line-clamp-2 max-w-md">{row.description}</div>
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
          <div className="text-xs font-bold text-slate-700">Source: {row.submittedByType || 'Portal User'}</div>
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
        if (!isStaff) {
          return <span className="text-amber-700 font-extrabold text-xs flex items-center gap-1"><Clock className="w-4 h-4" /> In Review</span>;
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
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/30 transition self-end md:self-auto flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log New Grievance Ticket
        </button>
      </div>

      <DataTable
        title={t('ticket_directory_title')}
        subtitle={t('ticket_directory_subtitle')}
        data={tickets}
        columns={columns}
        searchPlaceholder={t('search_complaint_placeholder')}
      />

      {/* Log New Grievance Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Submit Grievance / Complaint</h3>
                  <p className="text-xs text-slate-500">Log a ticket directly with the school administration helpdesk</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Grievance Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ACADEMIC">Academic / Curriculum / Teaching</option>
                  <option value="INFRASTRUCTURE">Infrastructure & Facilities</option>
                  <option value="TRANSPORTATION">Transportation / School Bus</option>
                  <option value="CANTEEN">Canteen / Food Quality</option>
                  <option value="FEE_BILLING">Administrative / Fee Billing</option>
                  <option value="GENERAL_OTHER">General / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Priority Level *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Attention Required</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject / Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bus Delay on Route 4 / Issue with Science Lab Equipment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide complete details regarding your grievance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !description.trim()}
                  className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting Ticket...' : 'Submit Grievance Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComplaintsPage;
