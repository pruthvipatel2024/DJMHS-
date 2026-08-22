import api from './api';

export interface Exam {
  id: string;
  title: string;
  examType: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  standardId: string;
  isPublished: boolean;
  standard?: {
    name: string;
  };
}

export interface MarkEntryStudent {
  studentId: string;
  grNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  marksObtained: number | string;
  maxMarks: number;
  remarks?: string;
}

export const ExamService = {
  getExams: async (params?: { standardId?: string; isPublished?: boolean }): Promise<Exam[]> => {
    const res = await api.get('/exams', { params });
    return res.data.data || [];
  },

  createExam: async (data: Partial<Exam>): Promise<Exam> => {
    const res = await api.post('/exams', data);
    return res.data.data;
  },

  getGradingRoster: async (examId: string, subjectId: string, divisionId: string): Promise<MarkEntryStudent[]> => {
    const res = await api.get('/exams/marksheet', { params: { examId, subjectId, divisionId } });
    return res.data.data.roster || [];
  },

  submitMarks: async (payload: {
    examId: string;
    subjectId: string;
    divisionId: string;
    marks: Array<{ studentId: string; marksObtained: number; remarks?: string }>;
  }): Promise<void> => {
    await api.post('/exams/marks', payload);
  },

  getStudentResult: async (studentId: string, examId: string): Promise<any> => {
    const res = await api.get('/exams/results', { params: { studentId, examId } });
    return res.data.data;
  },
};

export default ExamService;
