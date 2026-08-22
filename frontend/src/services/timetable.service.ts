import api from './api';

export interface TimetableCell {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  subjectId: string;
  staffId: string;
  divisionId: string;
  subject?: { name: string; code: string };
  staff?: { firstName: string; lastName: string };
}

export const TimetableService = {
  getTimetable: async (divisionId: string): Promise<TimetableCell[]> => {
    const res = await api.get('/timetables', { params: { divisionId } });
    return res.data.data || [];
  },

  upsertSlot: async (payload: {
    divisionId: string;
    dayOfWeek: string;
    periodNumber: number;
    subjectId: string;
    staffId: string;
  }): Promise<TimetableCell> => {
    const res = await api.post('/timetables/slot', payload);
    return res.data.data;
  },

  checkClash: async (staffId: string, dayOfWeek: string, periodNumber: number): Promise<{ hasClash: boolean; conflictDetails?: string }> => {
    const res = await api.get('/timetables/check-clash', { params: { staffId, dayOfWeek, periodNumber } });
    return res.data.data;
  },
};

export default TimetableService;
