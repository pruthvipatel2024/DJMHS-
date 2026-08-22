import api from './api';

export interface AdminMetrics {
  totalStudents: number;
  totalStaff: number;
  totalDivisions: number;
  attendancePercentage: number;
  totalFeeCollected: number;
  totalPendingDues: number;
  activeAlerts?: number;
}

export interface RevenueTrendItem {
  month: string;
  collection: number;
  pending: number;
}

export interface DepartmentChartItem {
  departmentName: string;
  staffCount: number;
}

export interface AuditLogItem {
  id: string;
  actorName: string;
  action: string;
  reason?: string;
  createdAt: string;
}

export interface BroadcastNoticeItem {
  id?: string;
  title?: string;
  titleEn?: string;
  content?: string;
  contentEn?: string;
  priority?: string;
  createdAt: string;
}

export interface AdminDashboardData {
  metrics: AdminMetrics;
  monthlyRevenueTrend: RevenueTrendItem[];
  departmentChart: DepartmentChartItem[];
  recentActivity: AuditLogItem[];
  recentAttendanceLogs?: any[];
  activeAnnouncements: BroadcastNoticeItem[];
}

export const DashboardService = {
  getAdminMetrics: async (): Promise<AdminDashboardData> => {
    const res = await api.get('/dashboard/admin');
    return res.data.data;
  },

  getTeacherMetrics: async (): Promise<any> => {
    const res = await api.get('/dashboard/teacher');
    return res.data.data;
  },

  getPortalMetrics: async (studentId?: string): Promise<any> => {
    const query = studentId ? `?studentId=${studentId}` : '';
    const res = await api.get(`/dashboard/portal${query}`);
    return res.data.data;
  },
};

export default DashboardService;
