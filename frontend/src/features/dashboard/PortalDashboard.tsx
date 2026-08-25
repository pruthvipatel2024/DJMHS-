import React, { useState, useEffect } from 'react';
import { CalendarCheck, BookOpenCheck, Coins, Megaphone, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import DashboardService from '../../services/dashboard.service';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import { getFullPhotoUrl } from '../../utils/photo.utils';

const PortalDashboard: React.FC = () => {
  const { activeSibling } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchPortal = async () => {
      setLoading(true);
      try {
        const portalData = await DashboardService.getPortalMetrics(activeSibling?.id);
        setData(portalData);
        setImageError(false);
      } catch (err) {
        setData({
          student: activeSibling || null,
          metrics: { attendancePercentage: 0, pendingFeeBalance: 0, nextExamTitle: 'No Upcoming Exam', nextExamDate: '-' },
          pendingInstallments: [],
          announcements: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPortal();
  }, [activeSibling]);

  if (loading) return <LoadingSkeleton rows={3} type="card" />;

  const { student, metrics, pendingInstallments, announcements } = data || {};
  const photoPath = getFullPhotoUrl(student?.photoUrl);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Student Profile Banner */}
      <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-slate-900 rounded-2xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 border border-primary-600">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto">
          {photoPath && !imageError ? (
            <img
              src={photoPath}
              alt={`${student?.firstName} ${student?.lastName}`}
              onError={() => setImageError(true)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-accent-400 shadow-md flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-accent-400 to-accent-600 text-slate-900 font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-md flex-shrink-0">
              {student?.firstName?.[0] || 'S'}
            </div>
          )}
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-primary-600/80 border border-primary-400/30 text-accent-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider max-w-full truncate">
              GR: {student?.grNumber || 'DJMHS-001'} | Roll No: {student?.rollNumber || '01'}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate">
              {student?.firstName} {student?.lastName}
            </h1>
            <p className="text-primary-200 text-xs md:text-sm font-semibold leading-relaxed">
              {student?.division?.standard?.name || 'Standard 10'} — Division {student?.division?.name || 'A'} | Shree Dhaneshkumar Jasvantlal Maheta High School (Est. 1959)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/portal/fees"
            className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-slate-900 font-extrabold text-xs transition shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2"
          >
            <Coins className="w-4 h-4" />
            View Fee Status
          </Link>
        </div>
      </div>

      {/* Performance & Academic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Attendance Ratio Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Compliance</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1.5">{metrics?.attendancePercentage ?? 0}%</h3>
            <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Excellent Record
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Fee Ledger Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Fee Dues</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1.5">₹{(metrics?.pendingFeeBalance || 0).toLocaleString()}</h3>
            <Link to="/portal/fees" className="text-xs text-primary-600 font-bold hover:underline mt-1 inline-block">Pay Online / Receipts &rarr;</Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Upcoming Examination Countdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Exam</p>
            <h4 className="text-sm font-bold text-slate-800 mt-1.5 line-clamp-1">{metrics?.nextExamTitle || 'Mid-Term Assessment'}</h4>
            <span className="text-xs text-primary-600 font-bold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Date: {metrics?.nextExamDate || 'Sept 15, 2026'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
            <BookOpenCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pending Installments & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" /> Pending Fee Installment Accounts
          </h3>
          <div className="space-y-3">
            {pendingInstallments?.map((inst: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{inst.title}</h4>
                  <p className="text-xs text-slate-500">Due Date: {new Date(inst.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-900 block">₹{inst.amount.toLocaleString()}</span>
                  <Link to="/portal/fees" className="text-[11px] font-bold text-primary-600 hover:underline block">Settle Account &rarr;</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-600" /> School Broadcast Announcements
          </h3>
          <div className="space-y-3">
            {announcements?.map((n: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-primary-50/50 border border-primary-200/50 space-y-1">
                <span className="text-[10px] font-bold text-primary-700 uppercase">{new Date(n.createdAt).toLocaleDateString()}</span>
                <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PortalDashboard;
