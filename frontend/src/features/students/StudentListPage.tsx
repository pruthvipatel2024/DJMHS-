import React, { useState, useEffect } from 'react';
import { Plus, GraduationCap, ArrowUpRight, CheckCircle2, Filter } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable/DataTable';
import api from '../../services/api';
import StudentFormModal from './StudentFormModal';
import StudentPromotionModal from './StudentPromotionModal';
import ConfirmDialog from '../../components/States/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';

import StudentService from '../../services/student.service';

import { formatDate } from '../../utils/date.utils';
import { getFullPhotoUrl } from '../../utils/photo.utils';

import StudentImportModal from './StudentImportModal';
import { FileSpreadsheet } from 'lucide-react';

const StudentListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [studentList, setStudentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [standardFilter, setStandardFilter] = useState<string>('');

  const handleExportExcel = async () => {
    try {
      const blob = await StudentService.exportExcel({ standardId: standardFilter || undefined });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DJMHS_Students_Export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setToastMsg('Failed to export students Excel workbook.');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await StudentService.getStudents({ standardId: standardFilter || undefined });
      setStudentList(data);
    } catch (e) {
      setStudentList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [standardFilter]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await StudentService.deleteStudent(confirmDeleteId);
      setToastMsg('Student withdrawn from active institutional roster.');
      fetchStudents();
    } catch (e) {
      setToastMsg('Failed to delete student record.');
    }
    setConfirmDeleteId(null);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const columns: Column<any>[] = [
    {
      header: t('gr_number'),
      accessor: 'grNumber',
      sortable: true,
      className: 'font-extrabold text-primary-700 font-mono',
    },
    {
      header: t('roll'),
      accessor: 'rollNumber',
      sortable: true,
      className: 'font-bold text-slate-700 w-12',
    },
    {
      header: t('student_name'),
      accessor: (row) => {
        const photoPath = getFullPhotoUrl(row.photoUrl);
        return (
          <div className="flex items-center gap-2.5">
            {photoPath ? (
              <img
                src={photoPath}
                alt=""
                className="w-8 h-8 rounded-xl object-cover border border-slate-300 flex-shrink-0"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-accent-100 text-amber-900 font-extrabold flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                {row.firstName[0]}
              </div>
            )}
            <div>
              <div className="font-extrabold text-slate-800">{row.firstName} {row.lastName}</div>
              <div className="text-[11px] text-slate-400 font-semibold">{row.gender}</div>
            </div>
          </div>
        );
      },
      sortable: true,
      sortKey: 'firstName',
    },
    {
      header: 'DOB (DD/MM/YYYY)',
      accessor: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{formatDate(row.dob)}</span>,
      sortable: true,
    },
    {
      header: t('standard_division'),
      accessor: (row) => (
        <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-900 font-black text-xs border border-indigo-200/60 shadow-xs">
          {row.division?.standard?.name || 'Standard 10'} — Div {row.division?.name || 'A'}
        </span>
      ),
      sortable: true,
    },
    {
      header: t('primary_guardian'),
      accessor: (row) => {
        const p = row.parents?.[0]?.parent;
        return p ? (
          <div>
            <div className="font-bold text-slate-800 text-xs">{p.firstName} {p.lastName}</div>
            <div className="font-mono text-[11px] text-slate-500">{p.phone}</div>
          </div>
        ) : <span className="text-slate-400 italic">{t('no_guardian_linked')}</span>;
      },
    },
  ];

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {/* Roster Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-200">
            <GraduationCap className="w-3.5 h-3.5" /> {t('student_roster_tag')}
          </div>
          <h2 className="text-2xl font-black text-slate-900">{t('student_page_title')}</h2>
          <p className="text-xs text-slate-500">{t('student_page_subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 rounded-xl border border-primary-300 bg-primary-50 hover:bg-primary-100 text-primary-900 font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-primary-700" />
            Bulk Excel Import
          </button>

          <button
            onClick={() => setShowPromoModal(true)}
            className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-700" />
            {t('academic_grade_promotion')}
          </button>

          <button
            onClick={() => { setEditingStudent(null); setShowFormModal(true); }}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition shadow-md shadow-primary-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('enroll_new_student')}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        title={t('student_register_table_title')}
        subtitle={t('student_register_table_subtitle')}
        data={studentList}
        columns={columns}
        onEdit={(item) => { setEditingStudent(item); setShowFormModal(true); }}
        onDelete={(item) => setConfirmDeleteId(item.id)}
        onRowClick={(item) => navigate(`/admin/students/${item.id}`)}
        onExportExcel={handleExportExcel}
        searchPlaceholder={t('search_student_placeholder')}
      />

      {showImportModal && (
        <StudentImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={(importedCount) => {
            fetchStudents();
            setToastMsg(`Excel Bulk Import Complete! ${importedCount} students successfully onboarded to PostgreSQL.`);
            setTimeout(() => setToastMsg(null), 5000);
          }}
        />
      )}

      {showFormModal && (
        <StudentFormModal
          isOpen={showFormModal}
          initialData={editingStudent}
          onClose={() => setShowFormModal(false)}
          onSuccess={(saved) => {
            fetchStudents();
            setToastMsg(editingStudent ? 'Student record updated successfully.' : 'Student enrolled successfully! GR Number generated and guardian notified via SMS.');
            setTimeout(() => setToastMsg(null), 5000);
          }}
        />
      )}

      {showPromoModal && (
        <StudentPromotionModal
          isOpen={showPromoModal}
          students={studentList}
          onClose={() => setShowPromoModal(false)}
          onSuccess={(promotedCount) => {
            fetchStudents();
            setToastMsg(`Academic grade promotion executed successfully! Advanced ${promotedCount} students to their new standard division.`);
            setTimeout(() => setToastMsg(null), 5000);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title={t('withdraw_student_title')}
        message={t('withdraw_student_msg')}
        confirmText={t('withdraw_from_institution')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

    </div>
  );
};

export default StudentListPage;
