import api from './api';

export interface AttendanceRecord {
  studentId: string;
  grNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  gender?: string;
  photoUrl?: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  remarks?: string;
  presentDays: number;
  totalMarkedDays: number;
  attendancePercentage: number;
  isLowAttendance: boolean;
}

export interface AttendanceReportItem {
  student: {
    grNumber: string;
    rollNumber: string;
    firstName: string;
    lastName: string;
  };
  attendancePercentage: number;
  presentDays: number;
  totalMarkedDays: number;
  isLowAttendance: boolean;
}

export interface MonthlyAttendanceReport {
  month: number;
  year: number;
  daysInMonth: number;
  matrix: AttendanceReportItem[];
}

export interface StandardWithDivisions {
  id: string;
  name: string;
  level: number;
  divisions: Array<{
    id: string;
    name: string;
    roomNumber?: string;
    capacity?: number;
  }>;
}

export const AttendanceService = {
  getDivisionRoster: async (divisionId: string, date: string): Promise<{
    division: any;
    students: AttendanceRecord[];
    date: string;
    todayDate: string;
    isFuture: boolean;
    isHistorical: boolean;
    isMarked: boolean;
    isLocked: boolean;
    isAdmin: boolean;
    isClassTeacher?: boolean;
  }> => {
    const res = await api.get('/attendance/division', { params: { divisionId, date } });
    return {
      division: res.data.data.division || null,
      students: res.data.data.students || [],
      date: res.data.data.date,
      todayDate: res.data.data.todayDate || new Date().toISOString().split('T')[0],
      isFuture: !!res.data.data.isFuture,
      isHistorical: !!res.data.data.isHistorical,
      isMarked: !!res.data.data.isMarked,
      isLocked: !!res.data.data.isLocked,
      isAdmin: !!res.data.data.isAdmin,
      isClassTeacher: res.data.data.isClassTeacher !== undefined ? !!res.data.data.isClassTeacher : true,
    };
  },

  markAttendance: async (payload: {
    divisionId: string;
    date: string;
    records: Array<{ studentId: string; status: string; remarks?: string }>;
  }): Promise<void> => {
    await api.post('/attendance/mark', payload);
  },

  getMonthlyReport: async (divisionId: string, month: number): Promise<MonthlyAttendanceReport> => {
    const res = await api.get('/attendance/report', { params: { divisionId, month } });
    return res.data.data;
  },

  getStandardsWithDivisions: async (): Promise<StandardWithDivisions[]> => {
    const res = await api.get('/settings');
    return res.data?.data?.standards || [];
  },

  getDivisions: async (): Promise<Array<{ id: string; name: string }>> => {
    const res = await api.get('/settings');
    const list: Array<{ id: string; name: string }> = [];
    if (res.data?.data?.standards) {
      res.data.data.standards.forEach((std: any) => {
        std.divisions?.forEach((div: any) => {
          list.push({
            id: div.id,
            name: `${std.name} — Division ${div.name} (${div.roomNumber || 'Room'})`,
          });
        });
      });
    }
    return list;
  },
};

export default AttendanceService;
