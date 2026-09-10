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
  ChevronRight,
  Bell,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import NotificationDropdown from '../components/Notifications/NotificationDropdown';
import logo from '../assets/logo.png';
import { getFullPhotoUrl } from '../utils/photo.utils';

const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const staff = user?.staffProfile;
  const isClassTeacher = (staff?.classTeaching && staff.classTeaching.length > 0) || false;
  const photoPath = getFullPhotoUrl(staff?.photoUrl);
  const fullName = staff ? `${staff.firstName} ${staff.lastName}`.trim() : 'Faculty Member';
  const empId = staff?.empId || 'DJMHS-EMP';
  const designation = staff?.designation?.replace('_', ' ') || 'Faculty';

  // Dynamic Navigation Items: Non-class teachers do not see attendance registers or class rosters
  const teacherNavItems = [
    { labelKey: 'teacher_overview', label: 'Dashboard Overview', path: '/teacher', icon: LayoutDashboard, exact: true },
    ...(isClassTeacher
      ? [
          { labelKey: 'my_classes', label: 'My Homeroom Class', path: '/teacher/classes', icon: Users },
          { labelKey: 'mark_attendance', label: 'Mark Attendance', path: '/teacher/attendance', icon: CalendarCheck },
          { labelKey: 'exams_marks', label: 'Exam Marksheet', path: '/teacher/exams/marksheet', icon: BookOpenCheck },
        ]
      : []),
    { labelKey: 'my_timetable', label: 'My Lecture Timetable', path: '/teacher/timetables', icon: CalendarDays },
    { labelKey: 'teacher_announcements', label: 'Circular Notices', path: '/teacher/announcements', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white flex flex-col transition-transform duration-300 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:flex-shrink-0 shadow-2xl border-r border-primary-800`}>
        
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center gap-3 border-b border-primary-800/80 flex-shrink-0 bg-primary-950/50">
          <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md border-2 border-accent-400 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img src={logo} alt="DJMHS School Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-black tracking-tight text-white truncate uppercase">DJMHS HIGH SCHOOL</h2>
            <p className="text-[11px] text-accent-400 font-bold tracking-wide">
              {isClassTeacher ? 'Class Teacher Portal' : 'Faculty Console'}
            </p>
          </div>
        </div>

        {/* Navigation Link List */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="text-[10px] uppercase font-black tracking-wider text-primary-300/70 px-3 mb-2">
            {t('academic_operations', 'Faculty Operations')}
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
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-950/40 border border-primary-500 font-bold'
                      : 'text-primary-100/80 hover:bg-primary-800/70 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-accent-400" />
                <span className="flex-1 truncate">{t(item.labelKey, item.label)}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            );
          })}
        </div>

        {/* BOTTOM STAFF PROFILE CARD IN SIDEBAR */}
        <div className="p-4 border-t border-primary-800 bg-primary-950/60 flex items-center gap-3">
          {photoPath && !imageError ? (
            <img
              src={photoPath}
              alt={fullName}
              onError={() => setImageError(true)}
              className="w-10 h-10 rounded-xl object-cover border-2 border-accent-400 shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-accent-500 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-accent-400 shadow-sm flex-shrink-0">
              {staff?.firstName?.[0] || 'T'}
            </div>
          )}

          <div className="overflow-hidden min-w-0 flex-1">
            <div className="text-white font-bold text-xs truncate">{fullName}</div>
            <div className="text-[11px] text-accent-400 font-medium truncate flex items-center gap-1">
              <span>{empId}</span>
              <span>&bull;</span>
              <span className="truncate">{designation}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Bar */}
        <header className="h-16 sm:h-20 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 p-2 rounded-xl border border-slate-200 flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                Faculty Academic Console
              </h3>
              <p className="text-xs text-slate-400 hidden sm:block">
                Shree Dhaneshkumar Jasvantlal Maheta High School
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <LanguageSwitcher />
            
            <NotificationDropdown align="right" />

            {/* Header User Badge */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              {photoPath && !imageError ? (
                <img
                  src={photoPath}
                  alt={fullName}
                  onError={() => setImageError(true)}
                  className="w-8 h-8 rounded-full object-cover border border-accent-400"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                  {staff?.firstName?.[0] || 'T'}
                </div>
              )}
              <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">
                {staff?.firstName || 'Faculty'}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Body Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
