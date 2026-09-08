import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CalendarCheck,
  BookOpenCheck,
  Megaphone,
  Clock,
  Calendar,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  CalendarDays,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import DashboardService from '../../services/dashboard.service';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { Link } from 'react-router-dom';
import { getFullPhotoUrl } from '../../utils/photo.utils';
import StorageService from '../../utils/storage.utils';

interface TimetableSlot {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber: string;
  subjectName: string;
  subjectCode: string;
  standardName: string;
  divisionName: string;
  standardId: string;
  divisionId: string;
}

interface WeeklyDaySchedule {
  day: string;
  dayName: string;
  periods: TimetableSlot[];
}

const TeacherDashboard: React.FC = () => {
  const cachedTeacherData = StorageService.get('sdjm_teacher_dashboard_cache', null);
  const [data, setData] = useState<any>(cachedTeacherData);
  const [loading, setLoading] = useState<boolean>(!cachedTeacherData);
  const [selectedDay, setSelectedDay] = useState<string>(cachedTeacherData?.activeScheduleDay || 'MON');
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const teacherData = await DashboardService.getTeacherMetrics();
        setData(teacherData);
        StorageService.set('sdjm_teacher_dashboard_cache', teacherData);
        if (teacherData?.activeScheduleDay) {
          setSelectedDay(teacherData.activeScheduleDay);
        } else if (teacherData?.todayDayCode && teacherData.todayDayCode !== 'SUN') {
          setSelectedDay(teacherData.todayDayCode);
        }
      } catch (err) {
        console.warn('Failed to load teacher dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const {
    staffProfile,
    isClassTeacher,
    classTeacherDetails = [],
    myClassesCount = 0,
    totalStudentsAssigned = 0,
    attendanceTodayStats,
    todayDayCode = 'MON',
    isWeekend = false,
    todaySchedule = [],
    weeklySchedule = [],
    totalLecturesToday = 0,
    totalWeeklyLectures = 0,
    distinctClassesCount = 0,
    distinctSubjectsCount = 0,
    recentNotices = []
  } = data || {};

  const primaryClass = classTeacherDetails?.[0] || {
    standard: 'Not Assigned',
    division: '-',
    room: '-',
    totalStudents: 0
  };

  // Find schedule periods for the currently selected day tab
  const activeDaySchedule: TimetableSlot[] = useMemo(() => {
    if (!weeklySchedule || weeklySchedule.length === 0) return todaySchedule;
    const foundDay = weeklySchedule.find((d: WeeklyDaySchedule) => d.day === selectedDay);
    return foundDay ? foundDay.periods : [];
  }, [weeklySchedule, selectedDay, todaySchedule]);

  // Determine current period status (e.g. in-session, upcoming, or completed)
  const getPeriodTimeStatus = (slot: TimetableSlot, isCurrentDay: boolean) => {
    if (!isCurrentDay) return 'SCHEDULED';
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const parseTimeToMinutes = (timeStr: string) => {
        // e.g. "07:30 AM" or "01:00 PM"
        const parts = timeStr.trim().split(' ');
        const [hourStr, minStr] = parts[0].split(':');
        let hour = parseInt(hourStr, 10);
        const min = parseInt(minStr, 10);
        const meridian = parts[1]?.toUpperCase();
        if (meridian === 'PM' && hour < 12) hour += 12;
        if (meridian === 'AM' && hour === 12) hour = 0;
        return hour * 60 + min;
      };

      const startMin = parseTimeToMinutes(slot.startTime);
      const endMin = parseTimeToMinutes(slot.endTime);

      if (currentMinutes >= startMin && currentMinutes <= endMin) return 'IN_SESSION';
      if (currentMinutes < startMin) return 'UPCOMING';
      return 'COMPLETED';
    } catch (e) {
      return 'SCHEDULED';
    }
  };

  if (loading) return <LoadingSkeleton rows={4} type="card" />;

  const photoPath = getFullPhotoUrl(staffProfile?.photoUrl);
  const fullName = staffProfile?.fullName || (staffProfile?.firstName ? `${staffProfile.firstName} ${staffProfile.lastName}` : 'Faculty Member');
  const empId = staffProfile?.empId || 'DJMHS-EMP';
  const designation = staffProfile?.designation?.replace('_', ' ') || 'Teacher';
  const departmentName = staffProfile?.department?.name || 'Academic Faculty';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. COMPREHENSIVE FACULTY MEMBER PROFILE BANNER */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-primary-700/50">
        
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Photo & Identity Group */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              {photoPath && !imageError ? (
                <img
                  src={photoPath}
                  alt={fullName}
                  onError={() => setImageError(true)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-3 border-accent-400 shadow-2xl bg-primary-950"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-accent-500 via-amber-400 to-accent-600 text-slate-950 font-black text-4xl flex items-center justify-center border-3 border-accent-400 shadow-2xl">
                  {staffProfile?.firstName?.[0] || 'T'}
                </div>
              )}
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px] tracking-wider uppercase border-2 border-primary-900 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Active
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-accent-400 text-slate-950 font-black text-[11px] tracking-wide uppercase shadow-xs">
                  {empId}
                </span>
                <span className="px-3 py-1 rounded-full bg-primary-700/80 text-primary-100 font-bold text-[11px] border border-primary-600/60">
                  {departmentName}
                </span>
                {isClassTeacher ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[11px] border border-emerald-500/40 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Class Teacher: {primaryClass.standard} ({primaryClass.division})
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 font-bold text-[11px] border border-indigo-400/30">
                    Subject Faculty
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {fullName}
              </h1>

              <p className="text-xs sm:text-sm text-primary-200 font-medium">
                {designation} &bull; Shree Dhaneshkumar Jasvantlal Maheta High School
              </p>

              {/* Contact & Employment Meta Pill Row */}
              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-primary-200/90 font-medium">
                {staffProfile?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-accent-400" /> {staffProfile.email}
                  </span>
                )}
                {staffProfile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-accent-400" /> {staffProfile.phone}
                  </span>
                )}
                {staffProfile?.joinDate && (
                  <span className="flex items-center gap-1.5 text-primary-300">
                    <Briefcase className="w-3.5 h-3.5 text-accent-400" /> Since {new Date(staffProfile.joinDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Action (Only for Class Teachers) */}
          {isClassTeacher && (
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch gap-3">
              <Link
                to="/teacher/attendance"
                className="px-6 py-3.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" />
                Mark Class Attendance
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2. CLASS TEACHER CONSOLE (RENDERED ONLY IF USER IS A DESIGNATED CLASS TEACHER) */}
      {isClassTeacher && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-600" /> Assigned Homeroom Division Management
            </h2>
            <span className="text-xs text-slate-500 font-semibold">
              Primary Class: <strong className="text-slate-800">{primaryClass.standard} — Div {primaryClass.division}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Assigned Roster Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Roster</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{totalStudentsAssigned} Students</h3>
                <p className="text-xs text-primary-600 font-semibold mt-1">
                  {primaryClass.standard} ({primaryClass.division}) &bull; {primaryClass.room}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Attendance Status Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Attendance</p>
                {attendanceTodayStats?.isMarked ? (
                  <div>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" /> Marked
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      {attendanceTodayStats.presentCount} Present &bull; {attendanceTodayStats.absentCount} Absent
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-2xl font-black text-amber-600 mt-1">Register Pending</h3>
                    <Link to="/teacher/attendance" className="text-xs text-primary-600 font-bold hover:underline mt-1 inline-block">
                      Open Register &rarr;
                    </Link>
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                attendanceTodayStats?.isMarked ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Examination Score Entry Tasks */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Term Assessments</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">Class Marksheet</h3>
                <Link to="/teacher/exams/marksheet" className="text-xs text-primary-600 font-bold hover:underline mt-1 inline-block">
                  Record Student Marks &rarr;
                </Link>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpenCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DAILY TEACHING LECTURE SCHEDULE & FULL DAY TIMETABLE CONSOLE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-6">
        
        {/* Timetable Header & Key Metrics */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Daily Lecture Schedule & Teaching Timetable
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isWeekend ? 'Sunday Weekend (Displaying Monday Schedule Preview)' : `Today is ${todayDayCode} — Review your scheduled periods, standards, classrooms, and timings.`}
            </p>
          </div>

          {/* Quick Schedule Stat Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3.5 py-1.5 rounded-xl bg-primary-50 text-primary-700 font-bold border border-primary-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-500" /> {totalLecturesToday} Lectures Scheduled Today
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200">
              {totalWeeklyLectures} Weekly Periods
            </span>
          </div>
        </div>

        {/* Interactive Day Selector Tabs (MON to SAT) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { code: 'MON', name: 'Monday' },
            { code: 'TUE', name: 'Tuesday' },
            { code: 'WED', name: 'Wednesday' },
            { code: 'THU', name: 'Thursday' },
            { code: 'FRI', name: 'Friday' },
            { code: 'SAT', name: 'Saturday' },
          ].map((d) => {
            const isTodayTab = d.code === todayDayCode;
            const isSelected = selectedDay === d.code;
            const dayPeriodsCount = weeklySchedule.find((w: WeeklyDaySchedule) => w.day === d.code)?.periods?.length || 0;

            return (
              <button
                key={d.code}
                onClick={() => setSelectedDay(d.code)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-900/20 ring-2 ring-primary-600 ring-offset-2'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span>{d.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {dayPeriodsCount}
                </span>
                {isTodayTab && (
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-accent-400' : 'bg-emerald-500'}`} title="Today" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day's Lecture Period Cards / Timeline Grid */}
        {activeDaySchedule && activeDaySchedule.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDaySchedule.map((slot: TimetableSlot, idx: number) => {
              const status = getPeriodTimeStatus(slot, selectedDay === todayDayCode);

              return (
                <div
                  key={slot.id || idx}
                  className={`rounded-2xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between gap-4 ${
                    status === 'IN_SESSION'
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-md ring-1 ring-emerald-400'
                      : status === 'UPCOMING'
                      ? 'bg-white border-slate-200 hover:border-primary-300 hover:shadow-md'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* Top Bar: Period Number, Time & Status Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-1 rounded-lg bg-primary-100 text-primary-800 font-black text-[11px] uppercase tracking-wide">
                        Period {slot.periodNumber}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-2">
                        <Clock className="w-3.5 h-3.5 text-primary-600" />
                        <span>{slot.startTime} &mdash; {slot.endTime}</span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {status === 'IN_SESSION' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" /> In Session
                      </span>
                    )}
                    {status === 'UPCOMING' && (
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-200">
                        Upcoming
                      </span>
                    )}
                    {status === 'COMPLETED' && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                        Done
                      </span>
                    )}
                  </div>

                  {/* Middle Content: Subject & Standard / Division */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-slate-800 tracking-tight">
                      {slot.subjectName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-primary-700">
                      <span className="px-2 py-0.5 rounded-md bg-primary-50 border border-primary-100">
                        {slot.subjectCode}
                      </span>
                      <span>&bull;</span>
                      <span>{slot.standardName} &mdash; Division {slot.divisionName}</span>
                    </div>
                  </div>

                  {/* Bottom Bar: Classroom / Location */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-accent-600" /> Room / Venue:
                    </span>
                    <span className="font-extrabold text-slate-800">
                      {slot.roomNumber || 'Main Building'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">
              No Lectures Scheduled for {selectedDay === 'MON' ? 'Monday' : selectedDay === 'TUE' ? 'Tuesday' : selectedDay === 'WED' ? 'Wednesday' : selectedDay === 'THU' ? 'Thursday' : selectedDay === 'FRI' ? 'Friday' : 'Saturday'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any teaching periods scheduled on this day. Use this time for curriculum preparation or department meetings.
            </p>
          </div>
        )}
      </div>

      {/* 4. FACULTY CIRCULAR NOTICES & ANNOUNCEMENT BOARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-bold text-slate-800">Faculty Circular Notices & Institutional Deadlines</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Bhavnagar Kelavani Mandal &bull; Est. 1959</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentNotices && recentNotices.length > 0 ? (
            recentNotices.map((n: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-primary-200 transition">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${
                    n.priority === 'HIGH' || n.priority === 'URGENT'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-primary-100 text-primary-700'
                  }`}>
                    {n.priority || 'GENERAL'} NOTICE
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{n.content}</p>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-6 text-center text-xs text-slate-400">
              No active circular notices broadcasted today.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TeacherDashboard;
