import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle2, ArrowRight, Phone, Mail, FileSpreadsheet } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable/DataTable';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';

import CrmService from '../../services/crm.service';

const InquiriesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await CrmService.getInquiries();
      setInquiries(data);
    } catch (e) {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleConvert = async (item: any) => {
    try {
      await api.post(`/crm/inquiries/${item.id}/convert`, { divisionId: 'div_09a' });
      setToastMsg(`Lead ${item.studentName} converted! Transferred pupil details into active Student Onboarding Admission Queue.`);
    } catch (e: any) {
      setToastMsg(e.response?.data?.message || 'Failed to convert prospective inquiry to student admission queue.');
    }
    fetchLeads();
    setTimeout(() => setToastMsg(null), 5000);
  };

  const columns: Column<any>[] = [
    {
      header: t('prospective_pupil_name'),
      accessor: (row) => (
        <div className="space-y-0.5">
          <div className="font-extrabold text-slate-900 text-sm">{row.studentName}</div>
          <div className="text-[11px] text-primary-600 font-bold">Target: {row.standard?.name || 'Standard 09'}</div>
        </div>
      ),
      sortable: true,
      sortKey: 'studentName',
    },
    {
      header: t('guardian_mobile'),
      accessor: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 text-xs">{row.parentName}</div>
          <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3 text-primary-600" /> {row.phone}</div>
        </div>
      ),
    },
    {
      header: t('previous_school'),
      accessor: (row) => <span className="text-xs font-semibold text-slate-600">{row.previousSchool || 'Local High School'}</span>,
    },
    {
      header: t('pipeline_status'),
      accessor: (row) => {
        if (row.status === 'ADMITTED') return <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">ADMITTED / ONBOARDED</span>;
        return <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-extrabold text-[11px]">NEW PROSPECTIVE LEAD</span>;
      },
      sortable: true,
    },
    {
      header: t('conversion_action'),
      accessor: (row) => {
        if (row.status === 'ADMITTED') {
          return <span className="text-slate-400 font-bold text-xs italic">Converted to General Register</span>;
        }
        return (
          <button
            onClick={() => handleConvert(row)}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition flex items-center gap-1.5"
          >
            <span>{t('convert_to_admission')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> {toastMsg}
        </div>
      )}

      {/* Control Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded border border-primary-200">
            <UserPlus className="w-3.5 h-3.5 inline mr-1" /> {t('prospective_pipeline_tag')}
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{t('inquiry_crm_title')}</h2>
          <p className="text-xs text-slate-500">{t('inquiry_crm_subtitle')}</p>
        </div>

        <button
          onClick={() => alert('Opening Manual Lead Capture Modal...')}
          className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/30 transition flex items-center gap-2 self-end md:self-auto"
        >
          <UserPlus className="w-4 h-4" /> {t('log_new_inquiry')}
        </button>
      </div>

      <DataTable
        title={t('prospective_lead_title')}
        subtitle={t('prospective_lead_subtitle')}
        data={inquiries}
        columns={columns}
        onExportExcel={() => alert('Exporting Admission Inquiry Pipeline to Excel (DJMHS_Admission_Leads.xlsx)...')}
        searchPlaceholder={t('search_inquiry_placeholder')}
      />

    </div>
  );
};

export default InquiriesPage;
