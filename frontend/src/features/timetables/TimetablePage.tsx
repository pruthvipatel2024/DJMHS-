import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  ShieldAlert,
  CheckCircle2,
  User,
  BookOpen,
  Lock,
  Eye,
  Sparkles,
  Layers,
  GraduationCap,
  Building2,
  CalendarDays,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import TimetableService from '../../services/timetable.service';
import TimetableCellModal from './TimetableCellModal';
import Modal from '../../components/Modal/Modal';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import StorageService from '../../utils/storage.utils';
import useUnsavedWarning from '../../utils/useUnsavedWarning';

const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const periods = [
  { p: 1, time: '07:30 AM — 08:20 AM', label: 'Period 1' },
  { p: 2, time: '08:20 AM — 09:10 AM', label: 'Period 2' },
  { p: 3, time: '09:10 AM — 10:00 AM', label: 'Period 3' },
  { p: 'break', time: '10:00 AM — 10:30 AM', label: 'Morning Recess / Nutrition Break' },
  { p: 4, time: '10:30 AM — 11:20 AM', label: 'Period 4' },
  { p: 5, time: '11:20 AM — 12:10 PM', label: 'Period 5' },
  { p: 6, time: '12:10 PM — 01:00 PM', label: 'Period 6' },
];

type ViewMode = 'MY_SCHEDULE' | 'CLASS_MATRIX' | 'FACULTY_MATRIX';

const TimetablePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const userRole = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');
  const isAdmin = userRole === 'ADMIN';
  const isTeacher = userRole === 'TEACHER';
  const currentStaffId = user?.staffProfile?.id;

  // Set default view mode based on user role
  const [viewMode, setViewMode] = useState<ViewMode>(isTeacher ? 'MY_SCHEDULE' : 'CLASS_MATRIX');

  const [divisions, setDivisions] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>(
    StorageService.get('sdjm_timetable_division', '')
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    isTeacher && currentStaffId ? currentStaffId : ''
  );

  const [scheduleData, setScheduleData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCell, setActiveCell] = useState<{ day: string; period: string; time: string; existing?: any } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftData, setDraftData] = useState<any | null>(null);

  // Clear modal and action state
  const [confirmClearType, setConfirmClearType] = useState<'DIVISION' | 'ALL' | 'STAFF' | null>(null);
  const [clearing, setClearing] = useState<boolean>(false);

  useEffect(() => {
    // Clear any stale timetable draft from storage on mount
    StorageService.remove('sdjm_timetable_draft');
  }, []);

  useUnsavedWarning(!!draftData, 'You have an unapproved timetable draft. Are you sure you want to refresh?');

  // Load divisions, departments, and staff members
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [settingsRes, staffRes] = await Promise.all([
          api.get('/settings'),
          api.get('/staff').catch(() => ({ data: { data: [] } })),
        ]);

        const list: any[] = [];
        settingsRes.data.data.standards?.forEach((std: any) => {
          std.divisions?.forEach((div: any) => {
            list.push({
              id: div.id,
              name: `${std.name} — Division ${div.name} (Room ${div.roomNumber || 'N/A'})`,
              standardName: std.name,
              divisionName: div.name,
              roomNumber: div.roomNumber,
            });
          });
        });
        setDivisions(list);

        const allStaff = staffRes.data?.data || [];
        setStaffList(allStaff);

        if (list.length > 0) {
          let preferredDiv = StorageService.get('sdjm_timetable_division', '');
          if (user?.studentProfile?.divisionId && list.some(d => d.id === user.studentProfile?.divisionId)) {
            preferredDiv = user.studentProfile.divisionId;
          } else if (user?.parentProfile?.students?.[0]?.student?.divisionId && list.some(d => d.id === user.parentProfile?.students?.[0]?.student?.divisionId)) {
            preferredDiv = user.parentProfile.students[0].student.divisionId;
          } else if (user?.staffProfile?.classTeaching?.[0]?.divisionId && list.some(d => d.id === user.staffProfile?.classTeaching?.[0]?.divisionId)) {
            preferredDiv = user.staffProfile.classTeaching[0].divisionId;
          }

          const initialDiv = preferredDiv && list.some(d => d.id === preferredDiv) ? preferredDiv : list[0].id;
          setSelectedDivision(initialDiv);
        }

        if (allStaff.length > 0 && !selectedStaffId) {
          if (isTeacher && currentStaffId) {
            setSelectedStaffId(currentStaffId);
          } else {
            setSelectedStaffId(allStaff[0].id);
          }
        }
      } catch (err) {
        setDivisions([]);
        setStaffList([]);
      }
    };
    fetchMetadata();
  }, [user, currentStaffId, isTeacher]);

  // Fetch timetable slots based on active viewMode
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      let slots: any[] = [];
      if (viewMode === 'MY_SCHEDULE' && currentStaffId) {
        slots = await TimetableService.getTimetable(undefined, currentStaffId);
      } else if (viewMode === 'FACULTY_MATRIX' && selectedStaffId) {
        slots = await TimetableService.getTimetable(undefined, selectedStaffId);
      } else if (selectedDivision) {
        slots = await TimetableService.getTimetable(selectedDivision, undefined);
      }

      const map: Record<string, any> = {};
      if (Array.isArray(slots)) {
        slots.forEach((s: any) => {
          const dayKey = String(s.dayOfWeek).slice(0, 3).toUpperCase();
          map[`${dayKey}_${s.periodNumber}`] = s;
        });
      }
      setScheduleData(map);
    } catch (e) {
      setScheduleData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    if (selectedDivision) {
      StorageService.set('sdjm_timetable_division', selectedDivision);
    }
  }, [viewMode, selectedDivision, selectedStaffId, currentStaffId]);

  // Auto-generate draft handler for Admin
  const handleAutoGenerateDraft = async () => {
    if (!isAdmin) return;
    setGeneratingDraft(true);
    try {
      const res = await api.post('/timetables/generate-draft', { periodsPerDay: 6 });
      setDraftData(res.data.data);
    } catch (e: any) {
      setToastMsg(e.response?.data?.message || 'Failed to auto-generate timetable draft.');
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleDiscardDraft = () => {
    setDraftData(null);
    StorageService.remove('sdjm_timetable_draft');
  };

  const handleApproveDraft = async () => {
    if (!isAdmin || !draftData) return;
    setLoading(true);
    try {
      const res = await api.post('/timetables/approve-draft', { draftId: draftData.draftId });
      setToastMsg(`Timetable draft approved! ${res.data.data.committedCount} period assignments committed to database.`);
      setDraftData(null);
      StorageService.remove('sdjm_timetable_draft');
      fetchSchedule();
    } catch (e: any) {
      setToastMsg(e.response?.data?.message || 'Failed to approve draft.');
    } finally {
      setLoading(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  // Clear timetable execution
  const handleExecuteClear = async () => {
    if (!isAdmin || !confirmClearType) return;
    setClearing(true);
    try {
      if (confirmClearType === 'DIVISION' && selectedDivision) {
        const res = await TimetableService.clearDivisionTimetable(selectedDivision);
        setToastMsg(`Class timetable cleared (${res.count} periods vacated). The schedule is now empty.`);
      } else if (confirmClearType === 'STAFF' && selectedStaffId) {
        const res = await TimetableService.clearStaffTimetable(selectedStaffId);
        setToastMsg(`Faculty timetable cleared (${res.count} periods vacated).`);
      } else if (confirmClearType === 'ALL') {
        const res = await TimetableService.clearAllTimetable();
        setToastMsg(`All institutional timetables cleared (${res.count} periods removed). Clean slate established.`);
      }
      setConfirmClearType(null);
      await fetchSchedule();
    } catch (e: any) {
      setToastMsg(e.response?.data?.message || 'Failed to clear timetable.');
    } finally {
      setClearing(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  // Stats computed from schedule data
  const weeklyStats = useMemo(() => {
    const rawSlots = Object.values(scheduleData);
    const totalAssigned = rawSlots.length;
    const uniqueClasses = Array.from(
      new Set(
        rawSlots
          .map((s: any) => `${s.division?.standard?.name || ''} (${s.division?.name || ''})`.trim())
          .filter(Boolean)
      )
    );
    const uniqueSubjects = Array.from(
      new Set(rawSlots.map((s: any) => s.subject?.name).filter(Boolean))
    );
    return {
      totalAssigned,
      uniqueClasses,
      uniqueSubjects,
    };
  }, [scheduleData]);

  const selectedDivisionObj = divisions.find((d) => d.id === selectedDivision);
  const selectedStaffObj = staffList.find((s) => s.id === (viewMode === 'MY_SCHEDULE' ? currentStaffId : selectedStaffId));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {toastMsg}
        </div>
      )}

      {/* Control Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded border border-primary-200">
            <Clock className="w-3.5 h-3.5 inline mr-1" /> {t('timetable_console_tag')}
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{t('timetable_matrix_title')}</h2>
          <p className="text-xs text-slate-500">{t('timetable_matrix_subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <>
              <button
                disabled={generatingDraft}
                onClick={handleAutoGenerateDraft}
                className="px-4 py-2.5 rounded-xl border border-primary-300 bg-primary-50 hover:bg-primary-100 text-primary-900 font-extrabold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Clock className="w-4 h-4 text-primary-700" />
                {generatingDraft ? 'Generating Draft...' : 'Auto-Generate Draft'}
              </button>

              {viewMode === 'CLASS_MATRIX' && weeklyStats.totalAssigned > 0 && (
                <button
                  onClick={() => setConfirmClearType('DIVISION')}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Clear all period assignments for the selected class division"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Clear Class Timetable
                </button>
              )}

              {viewMode === 'FACULTY_MATRIX' && weeklyStats.totalAssigned > 0 && (
                <button
                  onClick={() => setConfirmClearType('STAFF')}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Clear all period assignments for the selected teacher"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Clear Faculty Schedule
                </button>
              )}

              <button
                onClick={() => setConfirmClearType('ALL')}
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Reset all timetable records in the entire database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset All Timetables
              </button>
            </>
          )}

          {/* Contextual Filter Selector */}
          {viewMode === 'CLASS_MATRIX' ? (
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('target_schedule')}</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="p-3 border border-slate-300 rounded-xl text-xs font-black bg-white cursor-pointer w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>
          ) : viewMode === 'FACULTY_MATRIX' ? (
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('select_teacher')}</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="p-3 border border-slate-300 rounded-xl text-xs font-black bg-white cursor-pointer w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.firstName} {st.lastName} ({st.empId})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Authenticated Faculty</div>
              <div className="text-xs font-black text-slate-900">
                {user?.staffProfile?.firstName} {user?.staffProfile?.lastName} ({user?.staffProfile?.empId || 'Faculty'})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs for Teachers & Admin */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5">
          {isTeacher && (
            <button
              onClick={() => setViewMode('MY_SCHEDULE')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                viewMode === 'MY_SCHEDULE'
                  ? 'bg-white text-primary-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <User className="w-4 h-4 text-primary-600" />
              {t('my_weekly_schedule')}
            </button>
          )}

          <button
            onClick={() => setViewMode('CLASS_MATRIX')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'CLASS_MATRIX'
                ? 'bg-white text-primary-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Building2 className="w-4 h-4 text-primary-600" />
            {t('classroom_schedule')}
          </button>

          {isAdmin && (
            <button
              onClick={() => setViewMode('FACULTY_MATRIX')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                viewMode === 'FACULTY_MATRIX'
                  ? 'bg-white text-primary-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-primary-600" />
              {t('faculty_schedule')}
            </button>
          )}
        </div>

        {/* Workload Metric Pills for Faculty View */}
        {(viewMode === 'MY_SCHEDULE' || viewMode === 'FACULTY_MATRIX') && (
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl border border-slate-200/80 text-xs">
            <span className="text-[11px] font-bold text-slate-500">{t('weekly_load')}:</span>
            <span className="font-black text-primary-800 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
              {weeklyStats.totalAssigned} {t('lectures_per_week')}
            </span>
            {weeklyStats.uniqueClasses.length > 0 && (
              <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">
                across {weeklyStats.uniqueClasses.length} classes ({weeklyStats.uniqueClasses.join(', ')})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Timetable Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {/* Dynamic Table Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-extrabold text-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shadow-xs">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-900 font-black text-sm">
                {viewMode === 'MY_SCHEDULE'
                  ? `${t('my_weekly_schedule')} — ${user?.staffProfile?.firstName || 'Faculty'} ${user?.staffProfile?.lastName || ''}`
                  : viewMode === 'FACULTY_MATRIX'
                  ? `${t('faculty_schedule')}: ${selectedStaffObj ? `${selectedStaffObj.firstName} ${selectedStaffObj.lastName} (${selectedStaffObj.empId})` : t('select_teacher')}`
                  : `${t('weekly_academic_routine')}: ${selectedDivisionObj ? selectedDivisionObj.name : t('select_standard_division')}`}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                {viewMode === 'MY_SCHEDULE'
                  ? 'Your personalized weekly teaching routine across standards & classrooms (One lecture per period)'
                  : viewMode === 'FACULTY_MATRIX'
                  ? 'Master faculty schedule across all assigned high school & commerce divisions'
                  : isAdmin
                  ? 'Master schedule allocation & conflict monitoring'
                  : 'Official institutional class schedule'}
              </div>
            </div>
          </div>

          <div>
            {isAdmin && viewMode === 'CLASS_MATRIX' ? (
              <span className="text-primary-800 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                {t('click_cell_to_assign')}
              </span>
            ) : (
              <span className="text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                {t('view_only_schedule')}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white uppercase text-center font-extrabold border-b border-slate-700">
                  <th className="py-4 px-4 w-44 text-left bg-slate-900">{t('day_time_slot')}</th>
                  {periods.map((p, idx) => (
                    <th
                      key={idx}
                      className={`py-4 px-3 w-40 ${
                        p.p === 'break' ? 'bg-amber-400 text-slate-900 w-24 font-black' : ''
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-wide">{p.label}</div>
                      <div className="text-[10px] font-normal opacity-80">{p.time.split(' — ')[0]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {days.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/50 transition">
                    <td className="py-5 px-4 font-black text-slate-900 bg-slate-50/80 border-r border-slate-200 uppercase tracking-tight text-sm">
                      {day}
                    </td>

                    {periods.map((p, pIdx) => {
                      if (p.p === 'break') {
                        return (
                          <td
                            key={pIdx}
                            className="bg-amber-50/70 text-center text-amber-900 font-black text-[10px] border-r border-slate-200 uppercase tracking-widest px-2 select-none"
                          >
                            <div className="py-2">{t('recess')}</div>
                          </td>
                        );
                      }

                      const dayKey = day.slice(0, 3).toUpperCase();
                      const slot = scheduleData[`${dayKey}_${p.p}`];
                      const isOwnLecture = isTeacher && currentStaffId && slot?.staffId === currentStaffId;
                      const isPersonalFacultyView = viewMode === 'MY_SCHEDULE' || viewMode === 'FACULTY_MATRIX';

                      return (
                        <td
                          key={pIdx}
                          onClick={() => {
                            if (isAdmin && viewMode === 'CLASS_MATRIX') {
                              setActiveCell({ day, period: p.label, time: p.time, existing: slot });
                            }
                          }}
                          className={`p-2.5 border-r border-slate-100 transition relative min-h-[105px] h-[105px] align-top ${
                            isAdmin && viewMode === 'CLASS_MATRIX'
                              ? 'cursor-pointer hover:bg-primary-50/50 group'
                              : 'cursor-default select-none'
                          } ${
                            isOwnLecture && !isPersonalFacultyView
                              ? 'bg-emerald-50/50 ring-1 ring-inset ring-emerald-300'
                              : ''
                          }`}
                        >
                          {slot ? (
                            <div className="h-full flex flex-col justify-between space-y-1.5">
                              <div>
                                {/* In Faculty Schedule View: Display the Target Class Badge Prominently */}
                                {isPersonalFacultyView ? (
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="inline-flex items-center gap-1 font-black text-[10px] px-2 py-0.5 rounded bg-primary-100 text-primary-900 border border-primary-200 uppercase tracking-tight">
                                      <Building2 className="w-3 h-3 text-primary-700" />
                                      {slot.division?.standard?.name || 'Std'} — Div {slot.division?.name || 'A'}
                                    </span>
                                  </div>
                                ) : null}

                                {/* Subject Information */}
                                <div className="font-black text-slate-900 text-xs flex items-center justify-between gap-1">
                                  <span className="truncate flex items-center gap-1.5" title={slot.subject?.name}>
                                    <BookOpen className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                                    {slot.subject?.name || 'Subject'}
                                  </span>
                                  {isOwnLecture && !isPersonalFacultyView && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[9px] uppercase tracking-wider flex-shrink-0">
                                      {t('your_lecture')}
                                    </span>
                                  )}
                                </div>

                                {/* In Class Matrix View: Display Teacher Name */}
                                {!isPersonalFacultyView && (
                                  <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mt-1">
                                    <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">
                                      {slot.staff?.firstName} {slot.staff?.lastName}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Footer Meta: Room Number */}
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100/60">
                                <span className="font-mono font-extrabold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {slot.roomNumber || slot.division?.roomNumber || 'Room 101'}
                                </span>
                                {isAdmin && viewMode === 'CLASS_MATRIX' && (
                                  <span className="text-[9px] font-extrabold text-primary-600 opacity-0 group-hover:opacity-100 transition">
                                    Edit ✎
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : isAdmin && viewMode === 'CLASS_MATRIX' ? (
                            <div className="h-full w-full border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-[11px] font-bold group-hover:border-primary-400 group-hover:text-primary-600 group-hover:bg-white transition">
                              {t('assign_slot')}
                            </div>
                          ) : (
                            <div className="h-full w-full rounded-xl flex items-center justify-center text-slate-400 text-[11px] font-semibold bg-slate-50/50">
                              <span className="opacity-50 text-[11px]">{t('free_period')}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Slot Edit Modal */}
      {isAdmin && activeCell && viewMode === 'CLASS_MATRIX' && (
        <TimetableCellModal
          isOpen={!!activeCell}
          divisionId={selectedDivision}
          dayOfWeek={activeCell.day}
          periodLabel={activeCell.period}
          timeRange={activeCell.time}
          initialData={activeCell.existing}
          onClose={() => setActiveCell(null)}
          onSuccess={(msg) => {
            fetchSchedule();
            setToastMsg(msg || 'Schedule updated and teacher clash detection verified successfully.');
            setTimeout(() => setToastMsg(null), 5000);
          }}
        />
      )}

      {/* Admin Timetable Candidate Draft Review Modal */}
      {isAdmin && draftData && (
        <Modal
          isOpen={!!draftData}
          onClose={handleDiscardDraft}
          title="Automatic Timetable Generator — Candidate Draft Review"
          subtitle="Review candidate schedule assignments, detected clashes, and workload distribution before approving database commit."
          maxWidth="4xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 font-black text-[10px] uppercase">
                  DRAFT PREVIEW
                </span>
                <h4 className="font-extrabold text-base text-white mt-1">
                  Generated {draftData.totalSlots} Period Assignments
                </h4>
                <p className="text-xs text-slate-300">Conflict warnings: {draftData.conflictsCount}</p>
              </div>
              <button
                onClick={handleApproveDraft}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition shadow-md cursor-pointer"
              >
                Approve & Commit to Database
              </button>
            </div>

            {draftData.conflicts?.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-extrabold text-xs uppercase text-amber-800 tracking-wider">
                  Detected Clashes & Warnings
                </h5>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {draftData.conflicts.map((c: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      {c.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                  <tr>
                    <th className="p-2.5">Division</th>
                    <th className="p-2.5">Day</th>
                    <th className="p-2.5">Period</th>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5">Assigned Teacher</th>
                    <th className="p-2.5">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {draftData.slots?.slice(0, 50).map((s: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-800">{s.divisionName}</td>
                      <td className="p-2.5 font-bold text-primary-700">{s.dayOfWeek}</td>
                      <td className="p-2.5 text-slate-700">Period {s.periodNumber}</td>
                      <td className="p-2.5 font-bold text-slate-800">{s.subjectName}</td>
                      <td className="p-2.5 text-slate-700">{s.staffName}</td>
                      <td className="p-2.5 text-slate-600 font-mono">{s.roomNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleDiscardDraft}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Discard Draft
              </button>
              <button
                onClick={handleApproveDraft}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Approve & Commit to Database
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clear Timetable Confirmation Modal */}
      {isAdmin && confirmClearType && (
        <Modal
          isOpen={!!confirmClearType}
          onClose={() => setConfirmClearType(null)}
          title={
            confirmClearType === 'DIVISION'
              ? `Clear Class Timetable: ${selectedDivisionObj?.name || 'Class Division'}`
              : confirmClearType === 'STAFF'
              ? `Clear Faculty Schedule: ${selectedStaffObj?.firstName || ''} ${selectedStaffObj?.lastName || ''}`
              : 'Reset All School Timetables'
          }
          subtitle="This action will permanently vacate assigned schedule periods from PostgreSQL."
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold">
                  {confirmClearType === 'DIVISION'
                    ? `Are you sure you want to clear all period slots for ${selectedDivisionObj?.name || 'this class'}?`
                    : confirmClearType === 'STAFF'
                    ? `Are you sure you want to clear all lecture allocations for ${selectedStaffObj?.firstName || ''} ${selectedStaffObj?.lastName || ''}?`
                    : 'Are you sure you want to reset and delete ALL timetable periods across the entire school?'}
                </p>
                <p className="text-rose-700">
                  All assigned periods will be removed and vacated immediately. You can re-assign slots manually or use Auto-Generate Timetable Draft anytime.
                </p>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmClearType(null)}
                disabled={clearing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                disabled={clearing}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {clearing ? 'Clearing...' : 'Confirm Clear & Vacate'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TimetablePage;
