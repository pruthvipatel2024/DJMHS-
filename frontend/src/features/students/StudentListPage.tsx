import React, { useState, useEffect, useMemo } from 'react';
import { Plus, GraduationCap, ArrowUpRight, CheckCircle2, Building2, Users, FileSpreadsheet, Sparkles, Filter, X } from 'lucide-react';
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

import StorageService from '../../utils/storage.utils';

interface StandardWithDivisions {
  id: string;
  name: string;
  level: number;
  divisions: Array<{
    id: string;
    name: string;
    roomNumber?: string;
    capacity?: number;
  }>;
}

const StudentListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const savedListFilters = useMemo(() => {
    return StorageService.get<{ standardId?: string; divisionId?: string }>('sdjm_student_list_filters', {
      standardId: 'all',
      divisionId: 'all',
    });
  }, []);

  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [standards, setStandards] = useState<StandardWithDivisions[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active Standard & Division filters (restored across refreshes)
  const [selectedStandardId, setSelectedStandardId] = useState<string>(savedListFilters.standardId || 'all');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(savedListFilters.divisionId || 'all');

  useEffect(() => {
    StorageService.set('sdjm_student_list_filters', {
      standardId: selectedStandardId,
      divisionId: selectedDivisionId,
    });
  }, [selectedStandardId, selectedDivisionId]);

  // Load all standards and divisions from settings
  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.data?.standards && Array.isArray(res.data.data.standards)) {
          setStandards(res.data.data.standards);
        }
      } catch (e) {
        console.warn('Failed to load standards for filters', e);
      }
    };
    fetchStandards();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await StudentService.getStudents();
      setAllStudents(data || []);
    } catch (e) {
      setAllStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students class-wise and standard-wise on client side for instantaneous tabs switching
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      // Standard filter
      if (selectedStandardId !== 'all') {
        const studentStdId = student.division?.standardId || student.division?.standard?.id;
        if (studentStdId !== selectedStandardId) return false;
      }

      // Division filter
      if (selectedDivisionId !== 'all') {
        const studentDivId = student.divisionId || student.division?.id;
        if (studentDivId !== selectedDivisionId) return false;
      }

      return true;
    });
  }, [allStudents, selectedStandardId, selectedDivisionId]);

  // Compute student counts per standard for interactive badges
  const standardCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allStudents.length };
    standards.forEach((std) => {
      counts[std.id] = allStudents.filter((s) => (s.division?.standardId || s.division?.standard?.id) === std.id).length;
    });
    return counts;
  }, [allStudents, standards]);

  // Compute division counts for active standard
  const currentStandard = useMemo(() => {
    return standards.find((s) => s.id === selectedStandardId);
  }, [standards, selectedStandardId]);

  const divisionCounts = useMemo(() => {
    if (!currentStandard) return {};
    const counts: Record<string, number> = {};
    currentStandard.divisions?.forEach((div) => {
      counts[div.id] = allStudents.filter((s) => (s.divisionId || s.division?.id) === div.id).length;
    });
    return counts;
  }, [allStudents, currentStandard]);

  // Gender demographics for currently filtered cohort
  const cohortStats = useMemo(() => {
    const total = filteredStudents.length;
    const boys = filteredStudents.filter((s) => s.gender?.toLowerCase() === 'male').length;
    const girls = filteredStudents.filter((s) => s.gender?.toLowerCase() === 'female').length;
    return { total, boys, girls };
  }, [filteredStudents]);

  const handleExportExcel = async () => {
    try {
      const blob = await StudentService.exportExcel({
        standardId: selectedStandardId !== 'all' ? selectedStandardId : undefined,
        divisionId: selectedDivisionId !== 'all' ? selectedDivisionId : undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DJMHS_Students_Roster_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setToastMsg('Failed to export students Excel workbook.');
    }
  };

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
      accessor: (row) => <span className="font-mono font-bold text-slate-800">{row.rollNumber || '—'}</span>,
      sortable: true,
      sortKey: 'rollNumber',
      className: 'w-16',
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
                className="w-8 h-8 rounded-xl object-cover border border-slate-300 flex-shrink-0 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-accent-100 text-amber-900 font-extrabold flex items-center justify-center text-xs shadow-xs flex-shrink-0 border border-amber-300/60">
                {row.firstName?.[0] || 'S'}
              </div>
            )}
            <div>
              <div className="font-extrabold text-slate-900">{row.firstName} {row.lastName}</div>
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
        <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-950 font-black text-xs border border-indigo-200 shadow-xs inline-flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-indigo-600" />
          {row.division?.standard?.name || 'Standard'} — Div {row.division?.name || 'A'}
          {row.division?.roomNumber && <span className="text-[10px] text-indigo-600 font-normal">({row.division.roomNumber})</span>}
        </span>
      ),
      sortable: true,
    },
    {
      header: t('primary_guardian'),
      accessor: (row) => {
        const p = row.parents?.[0]?.parent;
        const parentName = p ? (p.fatherName || p.motherName || p.guardianName || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Guardian') : null;
        const parentPhone = p ? (p.phone || p.user?.phone || '') : null;
        return parentName ? (
          <div>
            <div className="font-bold text-slate-800 text-xs">{parentName}</div>
            {parentPhone && <div className="font-mono text-[11px] text-slate-500">{parentPhone}</div>}
          </div>
        ) : <span className="text-slate-400 italic text-xs">{t('no_guardian_linked')}</span>;
      },
    },
  ];

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Roster Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-200">
            <GraduationCap className="w-3.5 h-3.5" /> General Register & Pupil Records
          </div>
          <h2 className="text-2xl font-black text-slate-900">{t('student_page_title')}</h2>
          <p className="text-xs text-slate-500">Bhavnagar High School and Higher Secondary class-wise pupil roster and academic promotion manager.</p>
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
            onClick={() => {
              setEditingStudent(null);
              setShowFormModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition shadow-md shadow-primary-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('enroll_new_student')}
          </button>
        </div>
      </div>

      {/* Class & Standard Separation Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        
        {/* Tier 1: Standards Tabs Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Building2 className="w-4 h-4 text-primary-600" /> Standards:
            </span>

            {/* All Standards Tab */}
            <button
              onClick={() => {
                setSelectedStandardId('all');
                setSelectedDivisionId('all');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                selectedStandardId === 'all'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <span>All Standards</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedStandardId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                {standardCounts.all || 0}
              </span>
            </button>

            {/* Individual Standard Tabs */}
            {standards.map((std) => {
              const isActive = selectedStandardId === std.id;
              const count = standardCounts[std.id] || 0;
              return (
                <button
                  key={std.id}
                  onClick={() => {
                    setSelectedStandardId(std.id);
                    setSelectedDivisionId('all');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  <span>{std.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {(selectedStandardId !== 'all' || selectedDivisionId !== 'all') && (
            <button
              onClick={() => {
                setSelectedStandardId('all');
                setSelectedDivisionId('all');
              }}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Tier 2: Division Sub-Chips Bar (when a standard is selected or has divisions) */}
        {currentStandard && currentStandard.divisions && currentStandard.divisions.length > 0 && (
          <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase">Classroom Divisions:</span>
            
            <button
              onClick={() => setSelectedDivisionId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedDivisionId === 'all'
                  ? 'bg-primary-100 text-primary-900 border border-primary-300 font-extrabold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>All Divisions</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                {standardCounts[currentStandard.id] || 0}
              </span>
            </button>

            {currentStandard.divisions.map((div) => {
              const isDivActive = selectedDivisionId === div.id;
              const count = divisionCounts[div.id] || 0;
              return (
                <button
                  key={div.id}
                  onClick={() => setSelectedDivisionId(div.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    isDivActive
                      ? 'bg-primary-100 text-primary-900 border border-primary-300 font-extrabold ring-1 ring-primary-400'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Division {div.name}</span>
                  {div.roomNumber && <span className="text-[10px] text-slate-400 font-normal">({div.roomNumber})</span>}
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isDivActive ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Cohort Overview Card */}
        <div className="px-6 py-3.5 bg-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-indigo-950">
              Active Cohort:{' '}
              <strong>
                {selectedStandardId === 'all'
                  ? 'All Standards (Entire School)'
                  : `${currentStandard?.name || 'Standard'} ${selectedDivisionId !== 'all' ? `— Division ${currentStandard?.divisions?.find((d) => d.id === selectedDivisionId)?.name}` : '(All Divisions)'}`}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-semibold">
            <span>Enrolled Pupils: <strong className="text-slate-900">{cohortStats.total}</strong></span>
            <span>Boys: <strong className="text-blue-700">{cohortStats.boys}</strong></span>
            <span>Girls: <strong className="text-pink-700">{cohortStats.girls}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        title={selectedStandardId === 'all' ? t('student_register_table_title') : `${currentStandard?.name || 'Standard'} Roster Table`}
        subtitle={selectedStandardId === 'all' ? t('student_register_table_subtitle') : `Displaying pupils currently enrolled in ${currentStandard?.name}.`}
        data={filteredStudents}
        columns={columns}
        onEdit={(item) => {
          setEditingStudent(item);
          setShowFormModal(true);
        }}
        onDelete={(item) => setConfirmDeleteId(item.id)}
        onRowClick={(item) => navigate(`/admin/students/${item.id}`)}
        onExportExcel={handleExportExcel}
        searchPlaceholder={selectedStandardId === 'all' ? t('search_student_placeholder') : `Search in ${currentStandard?.name}...`}
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
          defaultStandardId={selectedStandardId !== 'all' ? selectedStandardId : undefined}
          defaultDivisionId={selectedDivisionId !== 'all' ? selectedDivisionId : undefined}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => {
            fetchStudents();
            setToastMsg(editingStudent ? 'Student record updated successfully.' : 'Student enrolled successfully! GR Number generated and guardian notified via SMS.');
            setTimeout(() => setToastMsg(null), 5000);
          }}
        />
      )}

      {showPromoModal && (
        <StudentPromotionModal
          isOpen={showPromoModal}
          students={allStudents}
          initialStandardId={selectedStandardId !== 'all' ? selectedStandardId : undefined}
          initialDivisionId={selectedDivisionId !== 'all' ? selectedDivisionId : undefined}
          onClose={() => setShowPromoModal(false)}
          onSuccess={(promotedCount) => {
            fetchStudents();
            setToastMsg(`Academic grade promotion executed successfully! Advanced ${promotedCount} pupils to their destination class.`);
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
