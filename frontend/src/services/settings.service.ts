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

export const SettingsService = {
  getSchoolProfile: async (): Promise<SchoolProfile> => {
    const res = await api.get('/settings/profile');
    return res.data.data;
  },

  updateSchoolProfile: async (data: Partial<SchoolProfile>): Promise<SchoolProfile> => {
    const res = await api.put('/settings/profile', data);
    return res.data.data;
  },

  exportDatabaseBackup: async (): Promise<Blob> => {
    const res = await api.get('/settings/backup', { responseType: 'blob' });
    return res.data;
  },
};

export default SettingsService;
