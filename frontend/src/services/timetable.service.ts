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
  getTimetable: async (divisionId?: string, staffId?: string): Promise<TimetableCell[]> => {
    const res = await api.get('/timetables', { params: { divisionId, staffId } });
    const payload = res.data?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.rawEntries)) return payload.rawEntries;
    if (Array.isArray(payload?.matrix)) return payload.matrix.flatMap((m: any) => m.periods || []);
    return [];
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

  clearDivisionTimetable: async (divisionId: string): Promise<{ count: number }> => {
    const res = await api.delete(`/timetables/clear-division/${divisionId}`);
    return res.data.data;
  },

  clearAllTimetable: async (): Promise<{ count: number }> => {
    const res = await api.delete('/timetables/clear-all');
    return res.data.data;
  },

  clearStaffTimetable: async (staffId: string): Promise<{ count: number }> => {
    const res = await api.delete(`/timetables/clear-staff/${staffId}`);
    return res.data.data;
  },
};

export default TimetableService;
