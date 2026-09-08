import api from './api';

export interface SchoolProfile {
  id: string;
  schoolName: string;
  shortName: string;
  trustName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
}

export interface SubjectItem {
  id: string;
  standardId: string;
  name: string;
  code: string;
  isOptional: boolean;
  standard?: {
    id: string;
    name: string;
    level: number;
  };
  teacherMappings?: Array<{
    id: string;
    staffId: string;
    divisionId: string;
    staff?: {
      id: string;
      empId: string;
      firstName: string;
      lastName: string;
      department?: { id: string; name: string };
    };
    division?: {
      id: string;
      name: string;
    };
  }>;
}

export interface StaffSubjectAllocation {
  id: string;
  staffId: string;
  subjectId: string;
  divisionId: string;
  staff: {
    id: string;
    empId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    photoUrl?: string | null;
    department?: { id: string; name: string };
  };
  subject: {
    id: string;
    name: string;
    code: string;
    standardId: string;
    standard?: { id: string; name: string; level: number };
  };
  division: {
    id: string;
    name: string;
    roomNumber?: string | null;
    standardId: string;
    standard?: { id: string; name: string; level: number };
  };
}

export const SettingsService = {
  getSettings: async (): Promise<any> => {
    const res = await api.get('/settings');
    return res.data.data;
  },

  getSchoolProfile: async (): Promise<SchoolProfile> => {
    const res = await api.get('/settings/school-profile');
    return res.data.data;
  },

  updateSchoolProfile: async (data: Partial<SchoolProfile>): Promise<SchoolProfile> => {
    const res = await api.put('/settings/school-profile', data);
    return res.data.data;
  },

  // Subjects Management
  getSubjects: async (standardId?: string): Promise<SubjectItem[]> => {
    const res = await api.get('/settings/subjects', { params: { standardId } });
    return res.data.data || [];
  },

  createSubject: async (data: { standardId: string; name: string; code?: string; isOptional?: boolean }): Promise<SubjectItem> => {
    const res = await api.post('/settings/subject', data);
    return res.data.data;
  },

  updateSubject: async (id: string, data: { name?: string; code?: string; isOptional?: boolean; standardId?: string }): Promise<SubjectItem> => {
    const res = await api.put(`/settings/subject/${id}`, data);
    return res.data.data;
  },

  deleteSubject: async (id: string): Promise<void> => {
    await api.delete(`/settings/subject/${id}`);
  },

  // Teacher Subject & Class Allocation
  getSubjectAllocations: async (params?: { standardId?: string; divisionId?: string; staffId?: string }): Promise<StaffSubjectAllocation[]> => {
    const res = await api.get('/settings/subject-allocations', { params });
    return res.data.data || [];
  },

  assignStaffSubject: async (data: { staffId: string; subjectId: string; divisionId: string }): Promise<StaffSubjectAllocation> => {
    const res = await api.post('/settings/subject-allocations', data);
    return res.data.data;
  },

  bulkSaveClassSubjectAssignments: async (divisionId: string, assignments: Array<{ subjectId: string; staffId: string }>): Promise<any> => {
    const res = await api.post('/settings/subject-allocations/bulk', { divisionId, assignments });
    return res.data;
  },

  deleteSubjectAllocation: async (id: string): Promise<void> => {
    await api.delete(`/settings/subject-allocations/${id}`);
  },
};

export default SettingsService;
