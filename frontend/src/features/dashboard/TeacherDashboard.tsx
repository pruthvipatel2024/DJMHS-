import React, { useState, useEffect } from 'react';
import { Users, CalendarCheck, BookOpenCheck, Megaphone, ArrowRight, Clock } from 'lucide-react';
import DashboardService from '../../services/dashboard.service';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { Link } from 'react-router-dom';

const TeacherDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const teacherData = await DashboardService.getTeacherMetrics();
        setData(teacherData);
      } catch (err) {
        setData({
          myClassesCount: 0,
          totalStudentsAssigned: 0,
          pendingMarksEntry: 0,
          classTeacherDetails: [],
          recentNotices: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSkeleton rows={3} type="card" />;

  const { totalStudentsAssigned, classTeacherDetails, recentNotices } = data || {};
  const primaryClass = classTeacherDetails?.[0] || { standard: 'Unassigned', division: '-', room: '-' };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Faculty Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-800 via-primary-700 to-primary-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-indigo-600/50">
        <div className="space-y-2 max-w-xl">
          <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 font-black text-[11px] uppercase tracking-wider">
            Faculty Academic Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Class Teacher — {primaryClass.standard} ({primaryClass.division})
          </h1>
          <p className="text-indigo-100 text-xs md:text-sm leading-relaxed">
            Shree Dhaneshkumar Jasvantlal Maheta High School. Managing daily digital attendance registers and subject examination mark sheets for your division.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
          <Link
            to="/teacher/attendance"
            className="px-6 py-3.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-slate-900 font-extrabold text-xs transition shadow-lg flex items-center justify-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" />
            Mark Today's Attendance
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Roster</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{totalStudentsAssigned || 40} Students</h3>
            <p className="text-xs text-primary-600 font-semibold mt-1">Division {primaryClass.division} ({primaryClass.room})</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Status</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">Today Unmarked</h3>
            <Link to="/teacher/attendance" className="text-xs text-primary-600 font-bold hover:underline mt-1 inline-block">Open Register &rarr;</Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Marks Entry Tasks</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">1 Exam Open</h3>
            <Link to="/teacher/exams" className="text-xs text-primary-600 font-bold hover:underline mt-1 inline-block">Enter Scores &rarr;</Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <BookOpenCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notice Board */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-bold text-slate-800">Faculty Circular Notices & Deadlines</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Est. 1959</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentNotices?.map((n: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-primary-600">{n.priority} NOTICE</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default TeacherDashboard;
