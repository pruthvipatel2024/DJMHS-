import api from './api';

export interface AdmissionInquiry {
  id: string;
  applicantName: string;
  parentName: string;
  phone: string;
  email?: string;
  seekingStandard: string;
  previousSchool?: string;
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED_VISIT' | 'ADMITTED' | 'REJECTED';
  notes?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNo: string;
  category: string;
  subject: string;
  description: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  studentId?: string;
  assignedToStaffId?: string;
  resolutionNotes?: string;
  createdAt: string;
  student?: {
    firstName: string;
    lastName: string;
    grNumber: string;
  };
}

export interface Announcement {
  id: string;
  titleEn: string;
  titleGu?: string;
  titleHi?: string;
  contentEn: string;
  contentGu?: string;
  contentHi?: string;
  targetRole: string;
  priority: string;
  createdAt: string;
}

export const CrmService = {
  // Admission Inquiries
  getInquiries: async (params?: { status?: string }): Promise<AdmissionInquiry[]> => {
    const res = await api.get('/crm/inquiries', { params });
    return res.data.data || [];
  },
  createInquiry: async (data: Partial<AdmissionInquiry>): Promise<AdmissionInquiry> => {
    const res = await api.post('/crm/inquiries', data);
    return res.data.data;
  },
  updateInquiryStatus: async (id: string, status: string, notes?: string): Promise<AdmissionInquiry> => {
    const res = await api.put(`/crm/inquiries/${id}/status`, { status, notes });
    return res.data.data;
  },

  // Complaints
  getComplaints: async (params?: { status?: string; priority?: string }): Promise<Complaint[]> => {
    const res = await api.get('/crm/complaints', { params });
    return res.data.data || [];
  },
  createComplaint: async (data: Partial<Complaint>): Promise<Complaint> => {
    const res = await api.post('/crm/complaints', data);
    return res.data.data;
  },
  resolveComplaint: async (id: string, resolutionNotes: string): Promise<Complaint> => {
    const res = await api.put(`/crm/complaints/${id}/resolve`, { resolutionNotes });
    return res.data.data;
  },

  // Announcements / Broadcast Notices
  getAnnouncements: async (params?: { targetRole?: string }): Promise<Announcement[]> => {
    const res = await api.get('/crm/announcements', { params });
    return res.data.data || [];
  },
  createAnnouncement: async (data: Partial<Announcement>): Promise<Announcement> => {
    const res = await api.post('/crm/announcements', data);
    return res.data.data;
  },
};

export default CrmService;
