import api from './api';

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  standardId?: string;
  divisionId?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface Student {
  id: string;
  grNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  admissionDate?: string;
  status: string;
  divisionId: string;
  division?: {
    id: string;
    name: string;
    standard?: {
      id: string;
      name: string;
    };
  };
  parents?: Array<{
    parent: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  }>;
}

export const StudentService = {
  getStudents: async (params?: StudentQueryParams): Promise<Student[]> => {
    const res = await api.get('/students', { params });
    return res.data.data || [];
  },

  getStudentById: async (id: string): Promise<Student> => {
    const res = await api.get(`/students/${id}`);
    return res.data.data;
  },

  createStudent: async (data: Partial<Student>): Promise<Student> => {
    const res = await api.post('/students', data);
    return res.data.data;
  },

  updateStudent: async (id: string, data: Partial<Student>): Promise<Student> => {
    const res = await api.put(`/students/${id}`, data);
    return res.data.data;
  },

  deleteStudent: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  promoteStudents: async (payload: { studentIds: string[]; targetDivisionId: string }): Promise<void> => {
    await api.post('/students/promote', payload);
  },

  previewImport: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/students/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  confirmImport: async (importJobId: string, rows: any[]): Promise<any> => {
    const res = await api.post('/students/import/confirm', { importJobId, rows });
    return res.data;
  },

  exportExcel: async (params?: StudentQueryParams): Promise<Blob> => {
    const res = await api.get('/students/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
};

export default StudentService;
