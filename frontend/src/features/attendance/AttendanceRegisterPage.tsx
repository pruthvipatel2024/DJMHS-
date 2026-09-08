import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarCheck, CheckCircle2, AlertCircle, Users, Send, Building2, Clock, ShieldAlert, Lock, AlertTriangle, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import AttendanceService, { StandardWithDivisions, AttendanceRecord } from '../../services/attendance.service';
import { getFullPhotoUrl } from '../../utils/photo.utils';
import StorageService from '../../utils/storage.utils';
import useUnsavedWarning from '../../utils/useUnsavedWarning';

const AttendanceRegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const todayStr = new Date().toISOString().split('T')[0];

  const savedFilters = useMemo(() => {
    return StorageService.get<{ standardId?: string; divisionId?: string; date?: string }>('sdjm_attendance_filters', {});
  }, []);

  const [standards, setStandards] = useState<StandardWithDivisions[]>([]);
  const [selectedStandardId, setSelectedStandardId] = useState<string>(savedFilters.standardId || '');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(savedFilters.divisionId || '');
  const [selectedDate, setSelectedDate] = useState<string>(savedFilters.date && savedFilters.date <= todayStr ? savedFilters.date : todayStr);

  const [students, setStudents] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isMarked, setIsMarked] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isClassTeacher, setIsClassTeacher] = useState<boolean>(true);
  const [isHistorical, setIsHistorical] = useState<boolean>(false);
  const [isFuture, setIsFuture] = useState<boolean>(false);

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);

  // Warn on accidental tab close or page refresh if unsaved modifications exist
  useUnsavedWarning(isDirty, 'You have unsubmitted student attendance marks in your active session. Are you sure you want to refresh? Your entered draft is preserved.');

  const draftKey = useMemo(() => {
    return selectedDivisionId && selectedDate ? `sdjm_attendance_draft_${selectedDivisionId}_${selectedDate}` : null;
  }, [selectedDivisionId, selectedDate]);

  // Persist filter selections in session storage so user returns to exact same standard/division/date
  useEffect(() => {
    if (selectedStandardId || selectedDivisionId || selectedDate) {
      StorageService.set('sdjm_attendance_filters', {
        standardId: selectedStandardId,
        divisionId: selectedDivisionId,
        date: selectedDate,
      });
    }
  }, [selectedStandardId, selectedDivisionId, selectedDate]);

  // 1. Fetch standards and divisions from settings
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await AttendanceService.getStandardsWithDivisions();
        setStandards(res || []);

        if (res && res.length > 0) {
          // Check if restored filter matches existing standard
          const targetStd = res.find((s) => s.id === savedFilters.standardId) || res[0];
          setSelectedStandardId(targetStd.id);

          if (targetStd.divisions && targetStd.divisions.length > 0) {
            const targetDiv = targetStd.divisions.find((d) => d.id === savedFilters.divisionId) || targetStd.divisions[0];
            setSelectedDivisionId(targetDiv.id);
          }
        }
      } catch (e) {
        console.warn('Failed to load standards for attendance', e);
      }
    };
    fetchMetadata();
  }, [savedFilters.standardId, savedFilters.divisionId]);

  // When standard tab changes, set active division to first division of that standard
  const handleSelectStandard = (stdId: string) => {
    setSelectedStandardId(stdId);
    const matchStd = standards.find((s) => s.id === stdId);
    if (matchStd?.divisions && matchStd.divisions.length > 0) {
      setSelectedDivisionId(matchStd.divisions[0].id);
    } else {
      setSelectedDivisionId('');
    }
  };

  // Find active standard and division objects
  const activeStandard = useMemo(() => {
    return standards.find((s) => s.id === selectedStandardId);
  }, [standards, selectedStandardId]);

  const activeDivision = useMemo(() => {
    return activeStandard?.divisions?.find((d) => d.id === selectedDivisionId);
  }, [activeStandard, selectedDivisionId]);

  // 2. Fetch class attendance roster whenever division or date changes
  const fetchAttendance = useCallback(async () => {
    if (!selectedDivisionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Validate date before query
    if (selectedDate > todayStr) {
      setSelectedDate(todayStr);
      setErrorMsg('Attendance cannot be marked or viewed for future dates.');
      setLoading(false);
      return;
    }

    try {
      const res = await AttendanceService.getDivisionRoster(selectedDivisionId, selectedDate);
      let roster = res.students || [];

      // Check if user had an in-progress draft before browser reload
      const currentDraftKey = `sdjm_attendance_draft_${selectedDivisionId}_${selectedDate}`;
      const savedDraft = StorageService.get<{ records?: Array<{ studentId: string; status: any; remarks?: string }> } | null>(
        currentDraftKey,
        null
      );

      if (savedDraft && savedDraft.records && savedDraft.records.length > 0 && !res.isLocked) {
        const draftMap = new Map(savedDraft.records.map((r) => [r.studentId, r]));
        roster = roster.map((s) => {
          const draftItem = draftMap.get(s.studentId);
          if (draftItem) {
            return {
              ...s,
              status: draftItem.status,
              remarks: draftItem.remarks !== undefined ? draftItem.remarks : s.remarks,
            };
          }
          return s;
        });
        setIsDraftRestored(true);
        setIsDirty(true);
      } else {
        setIsDraftRestored(false);
        setIsDirty(false);
      }

      setStudents(roster);
      setIsMarked(res.isMarked);
      setIsLocked(res.isLocked);
      setIsAdmin(res.isAdmin);
      setIsClassTeacher(res.isClassTeacher ?? true);
      setIsHistorical(res.isHistorical);
      setIsFuture(res.isFuture);
    } catch (e: any) {
      setStudents([]);
      setIsMarked(false);
      setIsLocked(false);
      setIsAdmin(false);
      setIsClassTeacher(true);
      setIsHistorical(false);
      setIsFuture(false);
      setErrorMsg(e.response?.data?.message || 'Failed to load class attendance roster.');
    } finally {
      setLoading(false);
    }
  }, [selectedDivisionId, selectedDate, todayStr]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Save in-progress draft whenever records are mutated
  const saveDraftToStorage = (updatedStudents: AttendanceRecord[]) => {
    if (draftKey && !isLocked) {
      StorageService.set(draftKey, {
        records: updatedStudents.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks || '',
        })),
        updatedAt: new Date().toISOString(),
      });
      setIsDirty(true);
    }
  };

  const handleDiscardDraft = () => {
    if (draftKey) {
      StorageService.remove(draftKey);
    }
    setIsDraftRestored(false);
    setIsDirty(false);
    fetchAttendance();
  };

  const setStatus = (id: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') => {
    if (isLocked) return;
    setStudents((prev) => {
      const updated = prev.map((s) => (s.studentId === id ? { ...s, status: newStatus } : s));
      saveDraftToStorage(updated);
      return updated;
    });
  };

  const setAllStatus = (status: 'PRESENT' | 'ABSENT') => {
    if (isLocked) return;
    setStudents((prev) => {
      const updated = prev.map((s) => ({ ...s, status }));
      saveDraftToStorage(updated);
      return updated;
    });
  };

  const updateStudentRemarks = (studentId: string, remarks: string) => {
    if (isLocked) return;
    setStudents((prev) => {
      const updated = prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s));
      saveDraftToStorage(updated);
      return updated;
    });
  };

  const handleSave = async () => {
    if (isLocked) return;
    if (selectedDate > todayStr) {
      setErrorMsg('Attendance cannot be submitted for future dates.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await AttendanceService.markAttendance({
        divisionId: selectedDivisionId,
        date: selectedDate,
        records: students.map((s) => ({ studentId: s.studentId, status: s.status, remarks: s.remarks || '' })),
      });

      // Clear draft once successfully saved to database
      if (draftKey) {
        StorageService.remove(draftKey);
      }
      setIsDirty(false);
      setIsDraftRestored(false);

      setSuccessMsg(`Attendance for ${activeStandard?.name} — Division ${activeDivision?.name} submitted successfully! Records persisted to PostgreSQL and guardian SMS alerts dispatched.`);
      setIsMarked(true);
      if (!isAdmin) setIsLocked(true);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to save attendance records.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Live and cumulative metrics for this class
  const presentCount = students.filter((s) => s.status === 'PRESENT' || s.status === 'HALF_DAY').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;
  const attendanceRatio = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 100;

  // Cumulative class average
  const classCumulativeAverage = useMemo(() => {
    if (students.length === 0) return 100;
    const sum = students.reduce((acc, s) => acc + (s.attendancePercentage || 100), 0);
    return Math.round(sum / students.length);
  }, [students]);

  // Low attendance pupil count (<75%)
  const lowAttendancePupils = students.filter((s) => s.isLowAttendance).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-600 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Draft Restored Banner */}
      {isDraftRestored && !isLocked && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="font-extrabold block">In-Progress Attendance Draft Restored</span>
              <span className="font-medium text-indigo-700">Your previously marked pupil statuses and notes for this class have been preserved across page refresh. Click submit when ready.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs whitespace-nowrap shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Discard Draft
          </button>
        </div>
      )}

      {/* Status Warning Banners */}
      {isHistorical && !isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-black uppercase tracking-wider block">Historical Register View (Date: {selectedDate})</span>
              <span>You are viewing a past attendance record in read-only audit mode. Teachers are only permitted to submit attendance for the current day.</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs"
          >
            Jump to Today
          </button>
        </div>
      )}

      {isMarked && !isHistorical && !isAdmin && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-3 shadow-xs">
          <Lock className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <div>
            <span className="font-black uppercase tracking-wider block">Attendance Register Submitted for Today</span>
            <span>Today's attendance for this class has already been marked and persisted. Only administrators can alter submitted registers.</span>
          </div>
        </div>
      )}

      {!isClassTeacher && !isAdmin && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <div>
            <span className="font-black uppercase tracking-wider block">Subject Faculty Mode (Read-Only)</span>
            <span>You are viewing the class roster as a Subject Teacher. Register submission and attendance updates are reserved for the designated Class Teacher and Administrators.</span>
          </div>
        </div>
      )}

      {/* Main Control Header & Date Picker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-200">
            <CalendarCheck className="w-3.5 h-3.5" /> Class-Wise Attendance Console
          </div>
          <h2 className="text-2xl font-black text-slate-900">{t('daily_attendance_title')}</h2>
          <p className="text-xs text-slate-500">Record daily classroom attendance, track cumulative presence percentages, and trigger automated guardian SMS alerts.</p>
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Attendance Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => {
                const val = e.target.value;
                if (val > todayStr) {
                  setErrorMsg('Cannot select future dates. Resetting to today.');
                  setSelectedDate(todayStr);
                } else {
                  setSelectedDate(val);
                }
              }}
              className="p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 bg-white"
            />
          </div>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-4 py-3 rounded-xl text-xs font-bold border transition ${
              selectedDate === todayStr
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Today ({todayStr})
          </button>
        </div>
      </div>

      {/* Class & Standard Separation Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        
        {/* Tier 1: Standard Tabs */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Building2 className="w-4 h-4 text-primary-600" /> Standards:
          </span>

          {standards.map((std) => {
            const isActive = selectedStandardId === std.id;
            return (
              <button
                key={std.id}
                onClick={() => handleSelectStandard(std.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <span>{std.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  Level {std.level}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tier 2: Division Sub-Chips for the active standard */}
        {activeStandard && activeStandard.divisions && activeStandard.divisions.length > 0 && (
          <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase">Classroom Divisions:</span>

            {activeStandard.divisions.map((div) => {
              const isDivActive = selectedDivisionId === div.id;
              return (
                <button
                  key={div.id}
                  onClick={() => setSelectedDivisionId(div.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    isDivActive
                      ? 'bg-primary-100 text-primary-900 border border-primary-300 font-extrabold ring-2 ring-primary-500/20'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Division {div.name}</span>
                  {div.roomNumber && (
                    <span className="text-[10px] text-primary-700 bg-primary-50 px-1.5 py-0.2 rounded border border-primary-200">
                      {div.roomNumber}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Active Class Cohort Status Summary Card */}
        <div className="px-6 py-3.5 bg-indigo-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-indigo-950">
              Active Register: <strong>{activeStandard?.name} — Division {activeDivision?.name}</strong> {activeDivision?.roomNumber ? `(${activeDivision.roomNumber})` : ''}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-semibold">
            <span>Class Enrolled: <strong className="text-slate-900">{students.length} Pupils</strong></span>
            <span>Term Average: <strong className="text-emerald-700">{classCumulativeAverage}%</strong></span>
            {lowAttendancePupils > 0 && (
              <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                ⚠️ {lowAttendancePupils} Low Attendance (&lt;75%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live Ratio & Bulk Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-800 to-indigo-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between sm:col-span-2">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-accent-300">{t('todays_class_attendance')}</span>
            <h3 className="text-3xl font-black mt-0.5">{attendanceRatio}% {t('compliance')}</h3>
            <p className="text-xs text-primary-200 mt-0.5">
              {presentCount} Present | {absentCount} Absent | {lateCount} Late ({students.length} Enrolled in Class)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent-400 text-slate-900 flex items-center justify-center font-black text-lg shadow">
            ✓
          </div>
        </div>

        <div className="sm:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-center gap-2">
          <span className="text-xs font-bold text-slate-700">⚡ Quick Marking for Active Class</span>
          <div className="flex gap-2">
            <button
              onClick={() => setAllStatus('PRESENT')}
              disabled={isLocked}
              type="button"
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs border transition flex items-center justify-center gap-1.5 ${
                isLocked ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mark All Present
            </button>
            <button
              onClick={() => setAllStatus('ABSENT')}
              disabled={isLocked}
              type="button"
              className={`py-2 px-3 rounded-xl font-extrabold text-xs border transition ${
                isLocked ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Reset All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Roster Sheet with Cumulative Attendance Statistics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
              {activeStandard?.name} — Division {activeDivision?.name} Roster ({students.length} Pupils)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Click status buttons to mark student presence</span>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No active students enrolled in {activeStandard?.name} — Division {activeDivision?.name}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] uppercase tracking-wider font-extrabold text-slate-600">
                  <th className="p-3.5 w-14 text-center">Roll</th>
                  <th className="p-3.5 w-32">GR Number</th>
                  <th className="p-3.5">Pupil Name</th>
                  <th className="p-3.5 w-44 text-center">Cumulative Attendance</th>
                  <th className="p-3.5 w-64">Daily Status Toggle</th>
                  <th className="p-3.5">Optional Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((std) => {
                  const photoPath = getFullPhotoUrl(std.photoUrl);
                  return (
                    <tr key={std.studentId} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-700 text-center">{std.rollNumber || '—'}</td>
                      <td className="p-3.5 font-mono font-bold text-primary-700">{std.grNumber}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {photoPath ? (
                            <img
                              src={photoPath}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-slate-300 flex-shrink-0"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-900 font-extrabold flex items-center justify-center text-[11px] flex-shrink-0 border border-indigo-200">
                              {std.firstName?.[0] || 'S'}
                            </div>
                          )}
                          <div className="font-extrabold text-slate-900 text-sm">
                            {std.firstName} {std.lastName}
                          </div>
                        </div>
                      </td>
                      
                      {/* Cumulative Student Attendance Percentage & Ratio */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-black text-xs border ${
                              std.isLowAttendance
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : std.totalMarkedDays > 0
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {std.attendancePercentage}% ({std.presentDays}/{std.totalMarkedDays} Days)
                          </span>
                          {std.isLowAttendance && (
                            <span className="text-[10px] text-rose-600 font-bold mt-0.5">⚠️ &lt;75% Low</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => setStatus(std.studentId, 'PRESENT')}
                            className={`px-3 py-1.5 rounded-lg font-black text-[11px] transition ${
                              std.status === 'PRESENT' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => setStatus(std.studentId, 'ABSENT')}
                            className={`px-3 py-1.5 rounded-lg font-black text-[11px] transition ${
                              std.status === 'ABSENT' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                          >
                            Absent (SMS)
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => setStatus(std.studentId, 'LATE')}
                            className={`px-2.5 py-1.5 rounded-lg font-black text-[11px] transition ${
                              std.status === 'LATE' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                          >
                            Late
                          </button>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={std.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateStudentRemarks(std.studentId, val);
                          }}
                          placeholder="e.g. Sick Leave / Doctor Appointment"
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={submitting || isLocked || students.length === 0}
            className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-black text-xs transition shadow-lg flex items-center justify-center gap-2 ${
              isLocked
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none'
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/30'
            }`}
          >
            <Send className="w-4 h-4" />
            {submitting
              ? 'Persisting Register...'
              : isLocked
              ? isHistorical
                ? 'Historical Register (Read Only)'
                : 'Register Locked (Submitted for Today)'
              : 'Submit Register & Fire Absentee Guardian SMS Alerts'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default AttendanceRegisterPage;
