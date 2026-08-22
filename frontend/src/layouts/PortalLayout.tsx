import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpenCheck,
  Coins,
  CalendarDays,
  Megaphone,
  MessageSquareWarning,
  LogOut,
  Menu,
  BookOpen,
  ChevronRight,
  Users,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import logo from '../assets/logo.png';

const portalNavItems = [
  { labelKey: 'dashboard_overview', path: '/portal', icon: LayoutDashboard, exact: true },
  { labelKey: 'attendance_record', path: '/portal/attendance', icon: CalendarCheck },
  { labelKey: 'exam_reports', path: '/portal/exams', icon: BookOpenCheck },
  { labelKey: 'fee_ledgers', path: '/portal/fees', icon: Coins },
  { labelKey: 'class_timetable', path: '/portal/timetable', icon: CalendarDays },
  { labelKey: 'school_notices', path: '/portal/announcements', icon: Megaphone },
  { labelKey: 'helpdesk', path: '/portal/complaints', icon: MessageSquareWarning },
];

const PortalLayout: React.FC = () => {
  const { user, logout, activeSibling, switchSibling } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isParent = user?.role?.name === 'PARENT';
  const siblings = user?.parentProfile?.students || [];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 text-white flex flex-col transition-transform duration-300 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:flex-shrink-0 shadow-2xl`}>
        
        <div className="h-20 px-5 flex items-center gap-3 border-b border-primary-700/60 flex-shrink-0 bg-primary-900/40">
          <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md border-2 border-accent-400 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img src={logo} alt="DJMHS School Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-black tracking-tight text-white truncate uppercase">DJMHS HIGH SCHOOL</h2>
            <p className="text-[11px] text-accent-400 font-bold tracking-wide">Student / Parent Portal</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-primary-300/70 px-3 mb-2">
            {t('academic_services')}
          </div>
          {portalNavItems.map((item) => {
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
          <p className="text-primary-300 font-medium">Active Record Profile:</p>
          <p className="text-white font-bold truncate">
            {activeSibling ? `${activeSibling.firstName} ${activeSibling.lastName} (Std ${activeSibling.division?.name || ''})` : 'Student Member'}
          </p>
          <p className="text-accent-400 font-semibold text-[10px]">GR No: {activeSibling?.grNumber || 'N/A'}</p>
        </div>
      </aside>

      {/* Main Content Wing */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 shadow-xs px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 p-2 rounded-xl border border-slate-200">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Student & Parent Portal</h3>
              <p className="text-xs text-slate-400 hidden sm:block">Shree Dhaneshkumar Jasvantlal Maheta High School (Est. 1959)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            
            {/* CRITICAL ENTERPRISE FEATURE: Parent Sibling Switcher Dropdown */}
            {isParent && siblings.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 shadow-xs">
                <Users className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-bold text-amber-900 hidden md:inline">Sibling Switcher:</span>
                <select
                  value={activeSibling?.grNumber || ''}
                  onChange={(e) => switchSibling(e.target.value)}
                  className="bg-transparent text-xs font-black text-amber-800 focus:outline-none cursor-pointer"
                >
                  {siblings.map((item) => (
                    <option key={item.student.grNumber} value={item.student.grNumber} className="text-slate-800 bg-white">
                      {item.student.firstName} {item.student.lastName} ({item.student.grNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

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

export default PortalLayout;
