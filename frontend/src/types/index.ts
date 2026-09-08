export type RoleType = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  identifier: string;
  email?: string;
  phone?: string;
  roleId: string;
  role: {
    id: string;
    name: RoleType;
    description?: string;
  };
  isActive: boolean;
  isLocked: boolean;
  lockUntil?: string;
  failedLoginAttempts: number;
  isFirstLogin: boolean;
  staffProfile?: StaffProfile;
  studentProfile?: StudentProfile;
  parentProfile?: ParentProfile;
  createdAt: string;
}

export interface StaffProfile {
  id: string;
  userId: string;
  empId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  gender: string;
  designation: string;
  employmentType?: string;
  joinDate?: string;
  dob?: string;
  address?: string;
  departmentId?: string;
  department?: { id: string; name: string; description?: string };
  phone: string;
  email: string;
  photoUrl?: string;
  classTeaching?: Array<{
    id: string;
    divisionId: string;
    academicYearId: string;
    isCoTeacher: boolean;
    division: {
      id: string;
      name: string;
      roomNumber?: string;
      standard: {
        id: string;
        name: string;
      };
    };
  }>;
}

export interface StudentProfile {
  id: string;
  userId: string;
  grNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  status: string;
  divisionId: string;
  division?: {
    id: string;
    name: string;
    standard?: { id: string; name: string };
  };
  photoUrl?: string;
  bloodGroup?: string;
}

export interface ParentProfile {
  id: string;
  userId: string;
  fatherName?: string;
  motherName?: string;
  phone: string;
  email?: string;
  students: {
    student: StudentProfile;
    isPrimary: boolean;
  }[];
}

export interface SessionRecord {
  id: string;
  device?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  isCurrentDevice: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  details?: { path: string; message: string }[];
}
