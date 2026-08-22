import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, AlertCircle, Clock, Users, Send, Check } from 'lucide-react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import AttendanceService from '../../services/attendance.service';

const AttendanceRegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [standards, setStandards] = useState<any[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<string>('');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isMarked, setIsMarked] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await AttendanceService.getDivisions();
        setDivisions(res || []);
        if (res && res.length > 0) {
          setSelectedDivision(res[0].id);
        }
      } catch (e) {
        setDivisions([]);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await AttendanceService.getDivisionRoster(selectedDivision, selectedDate);
        setStudents(res.students);
        setIsMarked(res.isMarked);
        setIsLocked(res.isLocked);
        setIsAdmin(res.isAdmin);
      } catch (e) {
        setStudents([]);
        setIsMarked(false);
        setIsLocked(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedDivision, selectedDate]);

  const setStatus = (id: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') => {
    if (isLocked) return;
    setStudents(prev => prev.map(s => s.studentId === id ? { ...s, status: newStatus } : s));
  };

  const setAllStatus = (status: 'PRESENT' | 'ABSENT') => {
    if (isLocked) return;
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await AttendanceService.markAttendance({
        divisionId: selectedDivision,
        date: selectedDate,
        records: students.map(s => ({ studentId: s.studentId, status: s.status, remarks: s.remarks || '' }))
      });
      setSuccessMsg('Attendance submitted successfully! Records persisted to PostgreSQL and guardian SMS alerts dispatched.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e: any) {
      setSuccessMsg(e.response?.data?.message || 'Failed to save attendance records.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = students.filter(s => s.status === 'PRESENT' || s.status === 'HALF_DAY').length;
  const absentCount = students.filter(s => s.status === 'ABSENT').length;
  const attendanceRatio = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Status Alert Banners */}
      {isLocked && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-black uppercase tracking-wider block">Attendance Register Locked</span>
              <span>Attendance for this class has already been submitted for today. Non-admin personnel cannot modify submitted attendance. Only Institutional Administrators can update marked registers.</span>
            </div>
          </div>
        </div>
      )}

      {isMarked && isAdmin && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="font-black uppercase tracking-wider block">Administrator Privilege Active</span>
              <span>Attendance is marked for today. As an Administrator, you can update pupil statuses or remarks and re-submit the register to PostgreSQL.</span>
            </div>
          </div>
        </div>
      )}

      {/* Control Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded border border-primary-200">
            <CalendarCheck className="w-3.5 h-3.5" /> {t('classroom_register_tag')}
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{t('daily_attendance_title')}</h2>
          <p className="text-xs text-slate-500">{t('daily_attendance_desc')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('standard_division_label')}</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="p-2.5 min-w-[220px] border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {divisions.length === 0 ? (
                <option value="">-- No Divisions Configured --</option>
              ) : (
                divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('session_date_label')}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Live Ratio & Bulk Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-800 to-indigo-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between sm:col-span-2">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-accent-300">{t('todays_class_attendance')}</span>
            <h3 className="text-3xl font-black mt-0.5">{attendanceRatio}% {t('compliance')}</h3>
            <p className="text-xs text-primary-200 mt-0.5">{presentCount} {t('present')} | {absentCount} {t('absent_sms')} ({students.length} Total Roster)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent-400 text-slate-900 flex items-center justify-center font-black text-lg shadow">
            ✓
          </div>
        </div>

        <div className="sm:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-center gap-2">
          <span className="text-xs font-bold text-slate-700">⚡ {t('rapid_register_setup')}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setAllStatus('PRESENT')}
              disabled={isLocked}
              type="button"
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs border transition flex items-center justify-center gap-1.5 ${
                isLocked ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t('mark_all_present')}
            </button>
            <button
              onClick={() => setAllStatus('ABSENT')}
              disabled={isLocked}
              type="button"
              className={`py-2 px-3 rounded-xl font-extrabold text-xs border transition ${
                isLocked ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {t('reset_all_absent')}
            </button>
          </div>
        </div>
      </div>

      {/* Roster Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
            Student Attendance Sheet ({students.length} Records)
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Click status chip to modify daily marking</span>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No active students found for selected division.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] uppercase tracking-wider font-extrabold text-slate-600">
                  <th className="p-3.5">Roll</th>
                  <th className="p-3.5">GR Number</th>
                  <th className="p-3.5">Pupil Name</th>
                  <th className="p-3.5">Status Toggle</th>
                  <th className="p-3.5">Optional Remarks / Medical Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((std) => (
                  <tr key={std.studentId} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-700">{std.rollNumber || '-'}</td>
                    <td className="p-3.5 font-mono font-bold text-primary-700">{std.grNumber}</td>
                    <td className="p-3.5 font-extrabold text-slate-800">{std.firstName} {std.lastName}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => setStatus(std.studentId, 'PRESENT')}
                          className={`px-3 py-1 rounded-lg font-black text-[11px] transition ${
                            std.status === 'PRESENT' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => setStatus(std.studentId, 'ABSENT')}
                          className={`px-3 py-1 rounded-lg font-black text-[11px] transition ${
                            std.status === 'ABSENT' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          Absent (SMS)
                        </button>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => setStatus(std.studentId, 'LATE')}
                          className={`px-3 py-1 rounded-lg font-black text-[11px] transition ${
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
                          setStudents(prev => prev.map(s => s.studentId === std.studentId ? { ...s, remarks: val } : s));
                        }}
                        placeholder="e.g. Sick Leave / Doctor Appointment"
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={submitting || isLocked}
            className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-black text-xs transition shadow-lg flex items-center justify-center gap-2 ${
              isLocked
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none'
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/30'
            }`}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Persisting Register...' : isLocked ? 'Register Locked (Submitted for Today)' : 'Submit Register & Fire Absentee Guardian SMS Alerts'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default AttendanceRegisterPage;
