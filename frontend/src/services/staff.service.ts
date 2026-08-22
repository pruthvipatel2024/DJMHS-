import api from './api';

export interface StaffQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  departmentId?: string;
  designation?: string;
}

export interface Staff {
  id: string;
  empId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  designation: string;
  joinDate: string;
  departmentId: string;
  phone: string;
  email: string;
  address: string;
  department?: {
    id: string;
    name: string;
  };
}

export const StaffService = {
  getStaff: async (params?: StaffQueryParams): Promise<Staff[]> => {
    const res = await api.get('/staff', { params });
    return res.data.data || [];
  },

  getStaffById: async (id: string): Promise<Staff> => {
    const res = await api.get(`/staff/${id}`);
    return res.data.data;
  },

  createStaff: async (data: Partial<Staff>): Promise<Staff> => {
    const res = await api.post('/staff', data);
    return res.data.data;
  },

  updateStaff: async (id: string, data: Partial<Staff>): Promise<Staff> => {
    const res = await api.put(`/staff/${id}`, data);
    return res.data.data;
  },

  deleteStaff: async (id: string): Promise<void> => {
    await api.delete(`/staff/${id}`);
  },

  uploadOcrStaff: async (formData: FormData): Promise<any> => {
    const res = await api.post('/ocr/staff-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  bulkImportStaff: async (records: Partial<Staff>[]): Promise<any> => {
    const res = await api.post('/staff/bulk-import', { records });
    return res.data;
  },
};

export default StaffService;
