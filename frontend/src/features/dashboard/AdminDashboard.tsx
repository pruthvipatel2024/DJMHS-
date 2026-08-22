import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Coins,
  TrendingUp,
  AlertCircle,
  Megaphone,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  BarChart2
} from 'lucide-react';
import DashboardService, { AdminDashboardData } from '../../services/dashboard.service';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFullPhotoUrl } from '../../utils/photo.utils';
import { formatDate } from '../../utils/date.utils';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData = await DashboardService.getAdminMetrics();
        setData(dashboardData);
      } catch (err) {
        setData({
          metrics: { totalStudents: 0, totalStaff: 0, totalDivisions: 0, attendancePercentage: 0, totalFeeCollected: 0, totalPendingDues: 0 },
          monthlyRevenueTrend: [],
          departmentChart: [],
          recentActivity: [],
          activeAnnouncements: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSkeleton rows={4} type="card" />;

  const { metrics, monthlyRevenueTrend, departmentChart, recentActivity, recentAttendanceLogs, activeAnnouncements } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-primary-600/50">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-accent-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600 text-accent-300 text-[11px] font-extrabold tracking-wider uppercase shadow-inner">
            <BookOpen className="w-3.5 h-3.5" />
            {t('exec_console_tag')}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {t('exec_console_title')}
          </h1>
          <p className="text-primary-200 text-xs md:text-sm leading-relaxed">
            {t('exec_console_desc')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch gap-3 relative z-10 w-full md:w-auto">
          <Link
            to="/admin/attendance"
            className="px-5 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-slate-900 font-bold text-xs transition shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" />
            {t('review_attendance')}
          </Link>
          <Link
            to="/admin/fees"
            className="px-5 py-3 rounded-xl bg-primary-600/80 hover:bg-primary-600 text-white font-semibold text-xs transition border border-primary-400 flex items-center justify-center gap-2"
          >
            <Coins className="w-4 h-4 text-accent-400" />
            {t('fee_accounts')}
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('active_students')}</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1.5">{metrics?.totalStudents || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              Live DB Record
            </span>
            <span className="text-slate-400">{metrics?.totalDivisions || 0} Divisions</span>
          </div>
        </div>

        {/* Staff & Faculty */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('teaching_staff')}</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1.5">{metrics?.totalStaff || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">{t('hod_faculty_members')}</span>
            <Link to="/admin/staff" className="text-primary-600 hover:underline font-bold">Directory &rarr;</Link>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('todays_attendance')}</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-1.5">{metrics?.attendancePercentage || 0}%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('high_compliance')}
            </span>
            <span className="text-slate-400">Standard 9–12</span>
          </div>
        </div>

        {/* Fee Collection Summary */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('fee_collections')}</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1.5">
                ₹{(metrics?.totalFeeCollected || 0).toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-semibold">Pending: ₹{(metrics?.totalPendingDues || 0).toLocaleString()}</span>
            <Link to="/admin/fees" className="text-primary-600 hover:underline font-bold">Reconcile &rarr;</Link>
          </div>
        </div>

      </div>

      {/* Analytics Visualization & Department Distribution Wing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Monthly Fee Collection Trend */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Fee Revenue & Installment Trend</h3>
                <p className="text-xs text-slate-400">Academic Year 2026-2027 Term 1 Inflows</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-primary-600" /> Quarterly View
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {!monthlyRevenueTrend || monthlyRevenueTrend.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No fee collection or installment data recorded yet.
                </div>
              ) : (
                monthlyRevenueTrend.map((m: any, idx: number) => {
                  const total = m.collection + m.pending;
                  const percent = total > 0 ? Math.min(100, Math.round((m.collection / total) * 100)) : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{m.month}</span>
                        <span>₹{(m.collection || 0).toLocaleString()} Collected ({percent}%)</span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${percent}%` }}
                          className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-l-full transition-all duration-500"
                        ></div>
                        <div className="bg-amber-400 flex-grow rounded-r-full opacity-60" title={`Pending: ₹${m.pending}`}></div>
                      </div>
                      <div className="flex justify-end text-[10px] text-slate-400">
                        Pending installments: ₹{(m.pending || 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-600 inline-block"></span> Paid Revenue
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block ml-3"></span> Pending Installments
            </span>
            <Link to="/admin/fees" className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1">
              View Complete Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Department Staff Allocation */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Faculty by Department</h3>
                <p className="text-xs text-slate-400">Staff strength distribution</p>
              </div>
              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-xl">Est. 1959</span>
            </div>

            <div className="space-y-3.5">
              {!departmentChart || departmentChart.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No staff members registered in academic departments.
                </div>
              ) : (
                departmentChart.map((dept: any, idx: number) => {
                  const colors = ['bg-primary-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-500'];
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`}></span>
                        <span className="text-xs font-bold text-slate-800">{dept.departmentName}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-extrabold text-xs shadow-xs">
                        {dept.staffCount} Members
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link to="/admin/staff" className="w-full inline-block py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
              Manage Department Rosters &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Live Attendance Register & Student Remarks Console */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-800">Live Attendance Register & Student Remarks Feed</h3>
          </div>
          <Link to="/admin/attendance" className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1">
            Open Attendance Register Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!recentAttendanceLogs || recentAttendanceLogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 font-medium">
            No attendance entries submitted for today yet. Open the Attendance Register Console to take daily class register.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
                  <th className="py-3 px-4">Pupil</th>
                  <th className="py-3 px-4">Standard & Division</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Teacher / Admin Remarks</th>
                  <th className="py-3 px-4">Session Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentAttendanceLogs.map((log: any) => {
                  const photoPath = getFullPhotoUrl(log.student?.photoUrl);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {photoPath ? (
                            <img src={photoPath} alt="" className="w-7 h-7 rounded-xl object-cover border border-slate-200 flex-shrink-0" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-7 h-7 rounded-xl bg-accent-100 text-amber-900 font-black flex items-center justify-center text-[11px] shadow-xs flex-shrink-0">
                              {log.student?.firstName?.[0] || 'S'}
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-slate-800 block">{log.student?.firstName} {log.student?.lastName}</span>
                            <span className="text-[10px] font-mono text-slate-400">GR: {log.student?.grNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200/60 font-extrabold text-[11px]">
                          {log.student?.division?.standard?.name || 'Standard'} — Div {log.student?.division?.name || 'A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase inline-block ${
                          log.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          log.status === 'ABSENT' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          log.status === 'LATE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {log.remarks ? (
                          <span className="italic bg-slate-100 px-2.5 py-1 rounded border border-slate-200 block max-w-xs truncate text-slate-800 font-semibold">{log.remarks}</span>
                        ) : (
                          <span className="text-slate-400 italic">No specific remarks</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {formatDate(log.date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Stream Wing: Activity Log & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Audit Activity Feed */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              <h3 className="text-base font-bold text-slate-800">Recent Institutional Activity Feed</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Live Auditory</span>
          </div>

          <div className="space-y-4">
            {!recentActivity || recentActivity.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                No recent system activity recorded yet.
              </div>
            ) : (
              recentActivity.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3.5 pb-3 border-b border-slate-100 last:border-none last:pb-0">
                  <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate">{log.actorName}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">{log.reason || log.action}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* School Broadcast Circulars */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">Broadcast Notices</h3>
            </div>
            <Link to="/admin/announcements" className="text-xs text-primary-600 font-bold hover:underline">Post New &rarr;</Link>
          </div>

          <div className="space-y-4">
            {!activeAnnouncements || activeAnnouncements.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                No active circulars or broadcast notices.
              </div>
            ) : (
              activeAnnouncements.map((notice: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                      {notice.priority || 'General'} Priority
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{notice.title || notice.titleEn}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{notice.content || notice.contentEn}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
