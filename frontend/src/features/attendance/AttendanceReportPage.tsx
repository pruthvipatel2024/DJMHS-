import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle, FileSpreadsheet, Download, CheckCircle2, XCircle } from 'lucide-react';
import AttendanceService from '../../services/attendance.service';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';

const AttendanceReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const res = await AttendanceService.getDivisions();
        setDivisions(res || []);
        if (res?.length > 0) setSelectedDivision(res[0].id);
      } catch (e) {
        setDivisions([]);
      }
    };
    fetchDivisions();
  }, []);

  useEffect(() => {
    if (!selectedDivision) {
      setLoading(false);
      return;
    }
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await AttendanceService.getMonthlyReport(selectedDivision, month);
        setReportData(data);
      } catch (e) {
        setReportData({ month, year: 2026, daysInMonth: 30, matrix: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [month, selectedDivision]);

  if (loading) return <LoadingSkeleton rows={6} />;

  const lowAttendanceCount = reportData?.matrix?.filter((r: any) => r.isLowAttendance)?.length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded border border-indigo-200">
            Monthly Audit Matrix
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Monthly Attendance & Compliance Report</h2>
          <p className="text-xs text-slate-500">Track cumulative presence and identify students falling below the mandatory 75% institutional threshold.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white">
              <option value="6">June 2026</option>
              <option value="7">July 2026</option>
              <option value="8">August 2026</option>
              <option value="9">September 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
            >
              {divisions.length === 0 ? (
                <option value="">-- No Divisions Available --</option>
              ) : (
                divisions.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={() => alert('Exporting Monthly Attendance Matrix to Excel Spreadsheet (DJMHS_Monthly_Attendance_Report.xlsx)...')}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-300 transition flex items-center gap-1.5 self-end"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </button>
        </div>
      </div>

      {/* Systemic Warning Banner */}
      {lowAttendanceCount > 0 && (
        <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-200 text-red-800 flex items-center justify-center font-black flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base">Systemic Compliance Warning Triggered!</h4>
              <p className="text-xs text-red-700 font-semibold">
                {lowAttendanceCount} student(s) currently sit below the required <strong>75.0% attendance threshold</strong>. Action required by HOD before exam hall ticket issuance.
              </p>
            </div>
          </div>

          <button
            onClick={() => alert('Sending automated Warning SMS Circular to parents of wards under 75% attendance...')}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/30 transition whitespace-nowrap"
          >
            Dispatch Warning SMS to Guardians
          </button>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
          Monthly Student Attendance Compliance Registry ({reportData?.matrix?.length || 0} Records)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                <th className="py-3.5 px-4 w-12">Roll</th>
                <th className="py-3.5 px-4">GR Number</th>
                <th className="py-3.5 px-4">Pupil Name</th>
                <th className="py-3.5 px-4 text-center">Present Days</th>
                <th className="py-3.5 px-4 text-center">Total Sessions</th>
                <th className="py-3.5 px-4 text-center">Attendance Ratio</th>
                <th className="py-3.5 px-4 text-right">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData?.matrix?.map((row: any, idx: number) => (
                <tr key={idx} className={`hover:bg-primary-50/20 transition ${row.isLowAttendance ? 'bg-red-50/30 font-semibold' : ''}`}>
                  <td className="py-4 px-4 font-black text-slate-800 text-center">{row.student.rollNumber}</td>
                  <td className="py-4 px-4 font-mono font-extrabold text-primary-700">{row.student.grNumber}</td>
                  <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">{row.student.firstName} {row.student.lastName}</td>
                  <td className="py-4 px-4 text-center font-bold text-emerald-700">{row.presentDays} Days</td>
                  <td className="py-4 px-4 text-center font-semibold text-slate-500">{row.totalMarkedDays} Days</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`text-sm font-black ${row.isLowAttendance ? 'text-red-600' : 'text-slate-800'}`}>
                      {row.attendancePercentage}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {row.isLowAttendance ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-100 text-red-800 font-extrabold text-xs border border-red-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Warning &lt; 75%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Compliant
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AttendanceReportPage;
