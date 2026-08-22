import React, { useState, useEffect } from 'react';
import { Plus, BookOpenCheck, Calendar, Award, FileText, ArrowRight } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable/DataTable';
import ExamService from '../../services/exam.service';
import ReportCardModal from './ReportCardModal';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';

const ExamListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamForReport, setSelectedExamForReport] = useState<any | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const data = await ExamService.getExams();
        setExams(data);
      } catch (e) {
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const columns: Column<any>[] = [
    {
      header: t('exam_title'),
      accessor: (row) => (
        <div className="space-y-0.5">
          <div className="font-extrabold text-slate-800 text-sm">{row.name}</div>
          <div className="text-[11px] text-primary-600 font-bold">{row.standard?.name || 'Standard 10'} Roster</div>
        </div>
      ),
      sortable: true,
      sortKey: 'name',
    },
    {
      header: t('schedule_timeline'),
      accessor: (row) => (
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {new Date(row.startDate).toLocaleDateString()} — {new Date(row.endDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: t('evaluation_status'),
      accessor: (row) => {
        const colors: Record<string, string> = {
          SCHEDULED: 'bg-indigo-100 text-indigo-800',
          COMPLETED: 'bg-emerald-100 text-emerald-800',
          DRAFT: 'bg-amber-100 text-amber-800',
        };
        return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${colors[row.status] || 'bg-slate-100 text-slate-700'}`}>{row.status}</span>;
      },
      sortable: true,
    },
    {
      header: t('actions_reports'),
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/exams/marksheet?examId=${row.id}`)}
            className="px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-xs border border-primary-200 transition"
          >
            {t('enter_scores')}
          </button>
          <button
            onClick={() => setSelectedExamForReport(row)}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-amber-700" /> {t('pdf_report_card')}
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded border border-primary-200">
            <BookOpenCheck className="w-3.5 h-3.5 inline mr-1" /> {t('exam_console_tag')}
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{t('exam_page_title')}</h2>
          <p className="text-xs text-slate-500">{t('exam_page_subtitle')}</p>
        </div>

        <button
          onClick={() => alert('Opening Exam Term Configuration Modal...')}
          className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/30 transition flex items-center gap-2 self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" /> {t('schedule_exam_session')}
        </button>
      </div>

      <DataTable
        title={t('active_examinations_title')}
        subtitle={t('active_examinations_subtitle')}
        data={exams}
        columns={columns}
        searchPlaceholder={t('search_exam_placeholder')}
      />

      {selectedExamForReport && (
        <ReportCardModal
          isOpen={!!selectedExamForReport}
          exam={selectedExamForReport}
          onClose={() => setSelectedExamForReport(null)}
        />
      )}

    </div>
  );
};

export default ExamListPage;
