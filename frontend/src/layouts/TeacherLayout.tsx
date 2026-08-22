import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpenCheck,
  CalendarDays,
  Megaphone,
  LogOut,
  Menu,
  BookOpen,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import logo from '../assets/logo.png';

const teacherNavItems = [
  { labelKey: 'teacher_overview', path: '/teacher', icon: LayoutDashboard, exact: true },
  { labelKey: 'my_classes', path: '/teacher/classes', icon: Users },
  { labelKey: 'student_directory', path: '/teacher/students', icon: GraduationCap },
  { labelKey: 'mark_attendance', path: '/teacher/attendance', icon: CalendarCheck },
  { labelKey: 'exams_marks', path: '/teacher/exams', icon: BookOpenCheck },
  { labelKey: 'my_timetable', path: '/teacher/timetable', icon: CalendarDays },
  { labelKey: 'teacher_announcements', path: '/teacher/announcements', icon: Megaphone },
];

const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const staff = user?.staffProfile;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 text-white flex flex-col transition-transform duration-300 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:flex-shrink-0 shadow-2xl`}>
        
        <div className="h-20 px-5 flex items-center gap-3 border-b border-primary-700/60 flex-shrink-0 bg-primary-900/40">
          <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md border-2 border-accent-400 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img src={logo} alt="DJMHS School Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-black tracking-tight text-white truncate uppercase">DJMHS HIGH SCHOOL</h2>
            <p className="text-[11px] text-accent-400 font-bold tracking-wide">Faculty Portal</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-primary-300/70 px-3 mb-2">
            {t('academic_operations')}
          </div>
          {teacherNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40 border border-primary-500 font-bold'
                      : 'text-primary-100/80 hover:bg-primary-700/50 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-accent-400" />
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-primary-700/60 bg-primary-900/40 text-[11px]">
          <div className="text-white font-bold">{staff ? `${staff.firstName} ${staff.lastName}` : 'Senior Faculty'}</div>
          <div className="text-accent-400 font-semibold">Emp ID: {staff?.empId || 'DJMHS-EMP'}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 shadow-xs px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 p-2 rounded-xl border border-slate-200">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Faculty Academic Console</h3>
              <p className="text-xs text-slate-400 hidden sm:block">Shree Dhaneshkumar Jasvantlal Maheta High School</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition">
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
