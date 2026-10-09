import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
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
  ChevronRight,
  Laptop,
  Award,
  Calendar
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import NotificationDropdown from '../components/Notifications/NotificationDropdown';
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
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Navigation Sidebar - Fixed Full-Height Non-Scrolling */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white flex flex-col h-screen max-h-screen transition-transform duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:sticky lg:top-0 lg:flex-shrink-0 shadow-2xl border-r border-primary-800/80 select-none`}
      >
        
        {/* Compact Brand Header (h-16 / 64px) */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-primary-800/80 flex-shrink-0 bg-primary-950/60">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-md border border-accent-400/80 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img src={logo} alt="DJMHS Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div className="overflow-hidden min-w-0">
            <h2 className="text-xs font-black tracking-tight text-white truncate uppercase">DJMHS HIGH SCHOOL</h2>
            <p className="text-[10px] text-accent-400 font-bold tracking-wide flex items-center gap-1">
              <span>ERP Admin Core</span>
            </p>
          </div>
        </div>

        {/* Navigation Items - Formatted to fit viewport without scrolling */}
        <nav className="flex-1 py-2 px-2.5 space-y-0.5 overflow-y-auto lg:overflow-y-hidden hover:lg:overflow-y-auto custom-scrollbar flex flex-col justify-start">
          <div className="text-[9px] uppercase font-black tracking-wider text-primary-400/80 px-2.5 py-1">
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
                  `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-950/50 border border-primary-500 font-bold'
                      : 'text-primary-100/75 hover:bg-primary-800/70 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-accent-400" />
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
                <ChevronRight className="w-3 h-3 opacity-30 group-hover:opacity-100" />
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Fixed / Sticky Top Header Navigation */}
        <header className="h-16 bg-white border-b border-slate-200/80 shadow-2xs px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 flex-shrink-0 backdrop-blur-md bg-white/95">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 truncate">
                Shree Dhaneshkumar Jasvantlal Maheta High School
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5 font-medium">
                <span>Administrative Enterprise Console</span>
                <span className="text-slate-300">•</span>
                <span className="text-primary-600 font-bold">Bhavnagar, Gujarat (Est. 1959)</span>
              </p>
            </div>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Academic Year Pill in Navbar */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 border border-primary-200/70 text-primary-800 text-[11px] font-extrabold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-primary-600" />
              <span>AY: 2026-2027</span>
            </div>

            <LanguageSwitcher />

            {/* Quick Session Shield */}
            <Link
              to="/admin/sessions"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition border border-slate-200/60 shadow-2xs"
              title={t('sessions')}
            >
              <Laptop className="w-3.5 h-3.5 text-primary-600" />
              <span className="hidden lg:inline">{t('sessions')}</span>
            </Link>

            {/* Notifications Dropdown */}
            <NotificationDropdown align="right" />

            {/* Profile Menu Toggle */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 sm:p-1.5 sm:pl-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
              >
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Principal Administrator</div>
                  <div className="text-[10px] text-primary-600 font-semibold uppercase tracking-wide">
                    {user?.role?.name || 'ADMIN'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-primary-600 text-white font-extrabold flex items-center justify-center shadow-xs text-xs">
                  {user?.identifier?.[0]?.toUpperCase() || 'A'}
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs md:hidden">
                    <p className="font-bold text-slate-800">{user?.identifier}</p>
                    <p className="text-primary-600 font-semibold">{user?.role?.name}</p>
                  </div>
                  <Link
                    to="/admin/sessions"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <Laptop className="w-4 h-4 text-slate-400" />
                    Manage Device Sessions
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold border-t border-slate-100"
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
        <main className="flex-1 p-3 sm:p-6 md:p-8 bg-slate-50 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
