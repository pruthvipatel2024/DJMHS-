import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpenCheck,
  CalendarDays,
  Coins,
  MessageSquareWarning,
  UserCheck,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  BookOpen,
  ChevronRight,
  Laptop,
  Award
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import logo from '../assets/logo.png';

const navItems = [
  { labelKey: 'dashboard', path: '/admin/dashboard', icon: LayoutDashboard, exact: true },
  { labelKey: 'staff_management', path: '/admin/staff', icon: Users },
  { labelKey: 'student_management', path: '/admin/students', icon: GraduationCap },
  { labelKey: 'certificates', path: '/admin/certificates', icon: Award },
  { labelKey: 'attendance', path: '/admin/attendance', icon: CalendarCheck },
  { labelKey: 'exams', path: '/admin/exams', icon: BookOpenCheck },
  { labelKey: 'timetable', path: '/admin/timetables', icon: CalendarDays },
  { labelKey: 'fees', path: '/admin/fees', icon: Coins },
  { labelKey: 'complaints', path: '/admin/complaints', icon: MessageSquareWarning },
  { labelKey: 'inquiries', path: '/admin/inquiries', icon: UserCheck },
  { labelKey: 'notices', path: '/admin/announcements', icon: Megaphone },
  { labelKey: 'reports', path: '/admin/reports', icon: BarChart3 },
  { labelKey: 'settings', path: '/admin/settings', icon: Settings },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Navigation Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 text-white flex flex-col transition-transform duration-300 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:flex-shrink-0 shadow-2xl`}>
        
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center gap-3 border-b border-primary-700/60 flex-shrink-0 bg-primary-900/40">
          <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md border-2 border-accent-400 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img src={logo} alt="DJMHS School Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-black tracking-tight text-white truncate uppercase">DJMHS HIGH SCHOOL</h2>
            <p className="text-[11px] text-accent-400 font-bold tracking-wide">ERP Executive Core</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          <div className="text-[10px] uppercase font-bold tracking-wider text-primary-300/70 px-3 mb-2">
            {t('institutional_modules')}
          </div>
          {navItems.map((item) => {
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
                <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
              </NavLink>
            );
          })}
        </div>

        {/* Footer info & Bhavnagar heritage */}
        <div className="p-4 border-t border-primary-700/60 bg-primary-900/40 text-[11px] text-primary-200/80">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-white">Academic Year:</span>
            <span className="px-2 py-0.5 rounded bg-primary-700 font-bold text-accent-300">2026-2027</span>
          </div>
          <p className="text-[10px] text-primary-400">Bhavnagar, Gujarat — Est. 1959</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Navigation */}
        <header className="h-16 sm:h-20 bg-white border-b border-slate-200 shadow-xs px-3 sm:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700 p-2 rounded-xl border border-slate-200 flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 truncate">Shree Dhaneshkumar Jasvantlal Maheta High School</h3>
              <p className="text-xs text-slate-400 hidden sm:block">Administrative Enterprise Console</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5 flex-shrink-0">
            <LanguageSwitcher />

            {/* Quick Session Shield */}
            <Link
              to="/admin/sessions"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              title={t('sessions')}
            >
              <Laptop className="w-3.5 h-3.5 text-primary-600" />
              {t('sessions')}
            </Link>

            {/* Notifications */}
            <button className="relative p-2 sm:p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-500 animate-ping"></span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-500"></span>
            </button>

            {/* Profile Menu Toggle */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1 sm:p-1.5 sm:pl-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              >
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Principal Administrator</div>
                  <div className="text-[10px] text-primary-600 font-semibold uppercase tracking-wide">Role: {user?.role?.name}</div>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary-600 text-white font-bold flex items-center justify-center shadow-sm text-xs sm:text-sm">
                  A
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs md:hidden">
                    <p className="font-bold text-slate-800">{user?.identifier}</p>
                    <p className="text-primary-600">{user?.role?.name}</p>
                  </div>
                  <Link
                    to="/admin/sessions"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <Laptop className="w-4 h-4 text-slate-400" />
                    Manage Device Sessions
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out of Portal
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Body Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
