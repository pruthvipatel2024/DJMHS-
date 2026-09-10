import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Megaphone,
  LifeBuoy,
  ShieldCheck,
  Calendar,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationService, { InAppNotification } from '../../services/notification.service';
import { useAuth } from '../../features/auth/AuthContext';

interface NotificationDropdownProps {
  align?: 'right' | 'left';
}

const formatRelativeTime = (dateStr: string): string => {
  if (!dateStr) return 'Just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getNotificationIcon = (title: string, message: string) => {
  const text = `${title} ${message}`.toLowerCase();
  if (text.includes('announcement') || text.includes('circular') || text.includes('notice')) {
    return <Megaphone className="w-4 h-4 text-amber-600" />;
  }
  if (text.includes('complaint') || text.includes('ticket') || text.includes('helpdesk') || text.includes('grievance')) {
    return <LifeBuoy className="w-4 h-4 text-rose-600" />;
  }
  if (text.includes('timetable') || text.includes('schedule') || text.includes('attendance') || text.includes('exam')) {
    return <Calendar className="w-4 h-4 text-primary-600" />;
  }
  if (text.includes('security') || text.includes('password') || text.includes('session')) {
    return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
  }
  return <Bell className="w-4 h-4 text-primary-600" />;
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ align = 'right' }) => {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');
  const isAdmin = userRole === 'ADMIN';
  const isTeacher = userRole === 'TEACHER';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from server
  const loadNotifications = async () => {
    try {
      const data = await NotificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await NotificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    await NotificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = notifications.find((n) => n.id === id);
    await NotificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Target announcements path based on active user role
  const announcementsPath = isAdmin
    ? '/admin/announcements'
    : isTeacher
    ? '/teacher/announcements'
    : '/portal/announcements';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="View notifications"
        className={`relative p-2 sm:p-2.5 rounded-xl border transition cursor-pointer ${
          isOpen
            ? 'bg-primary-50 text-primary-700 border-primary-300 ring-2 ring-primary-500/20'
            : 'text-slate-600 hover:bg-slate-100 border-slate-200'
        }`}
      >
        <Bell className="w-4 h-4" />
        
        {/* Dynamic unread count badge - Only rendered if unreadCount > 0 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">Notifications & Alerts</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-800 transition cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List Body */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`p-3.5 sm:p-4 flex items-start gap-3 transition cursor-pointer group ${
                    n.isRead
                      ? 'bg-white hover:bg-slate-50/80 opacity-80'
                      : 'bg-primary-50/30 hover:bg-primary-50/60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition">
                    {getNotificationIcon(n.title, n.message)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className={`text-xs font-black truncate ${n.isRead ? 'text-slate-800' : 'text-slate-950'}`}>
                        {n.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                        {formatRelativeTime(n.createdAt || n.sentAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                    {!n.isRead && (
                      <span
                        className="w-2 h-2 rounded-full bg-primary-600"
                        title="Unread"
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(n.id, e)}
                      title="Delete notification"
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Clean Empty State */
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-black text-slate-900">All Caught Up!</h5>
                <p className="text-xs text-slate-500 max-w-[220px] leading-relaxed">
                  You have no new notifications or alerts at this time.
                </p>
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              to={announcementsPath}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 font-bold text-primary-700 hover:text-primary-900 text-[11px] px-2.5 py-1 rounded-lg hover:bg-primary-50 transition"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Official Circulars</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </Link>

            {isAdmin && (
              <Link
                to="/admin/complaints"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 text-[11px] px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Helpdesk Tickets</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
