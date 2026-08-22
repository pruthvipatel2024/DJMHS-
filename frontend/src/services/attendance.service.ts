import api from './api';

export interface AttendanceRecord {
  studentId: string;
  grNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';
  remarks?: string;
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

export const AttendanceService = {
  getDivisionRoster: async (divisionId: string, date: string): Promise<{
    students: AttendanceRecord[];
    isMarked: boolean;
    isLocked: boolean;
    isAdmin: boolean;
  }> => {
    const res = await api.get('/attendance/division', { params: { divisionId, date } });
    return {
      students: res.data.data.students || [],
      isMarked: !!res.data.data.isMarked,
      isLocked: !!res.data.data.isLocked,
      isAdmin: !!res.data.data.isAdmin,
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

  getDivisions: async (): Promise<Array<{ id: string; name: string }>> => {
    const res = await api.get('/settings');
    const list: Array<{ id: string; name: string }> = [];
    if (res.data?.data?.standards) {
      res.data.data.standards.forEach((std: any) => {
        std.divisions.forEach((div: any) => {
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
