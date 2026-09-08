import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import { UserPlus, Save, Check, Upload, Trash2, Camera, MapPin, Sparkles, RotateCcw, Phone, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import StorageService from '../../utils/storage.utils';
import useUnsavedWarning from '../../utils/useUnsavedWarning';
import { getFullPhotoUrl } from '../../utils/photo.utils';

const phoneRegex = /^[6-9]\d{9}$/;
const nameRegex = /^[a-zA-Z\s.'-]+$/;

const staffSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters.')
    .max(50, 'First name cannot exceed 50 characters.')
    .regex(nameRegex, 'First name should only contain alphabets and valid punctuation (e.g. Rajeshbhai).'),
  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters.')
    .max(50, 'Last name cannot exceed 50 characters.')
    .regex(nameRegex, 'Last name should only contain alphabets (e.g. Patel).'),
  gender: z.string().min(1, 'Please select gender.'),
  dob: z
    .string()
    .min(1, 'Date of birth is required.')
    .refine((val) => {
      if (!val) return false;
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      if (d > now) return false;
      const age = (now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 18 && age <= 75;
    }, 'Date of birth must be a realistic age for a faculty member (between 18 and 75 years old).'),
  designation: z.string().min(1, 'Please select designation.'),
  departmentId: z.string().min(1, 'Please select faculty department.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Mobile contact number is mandatory.')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 10 && phoneRegex.test(val), {
      message: 'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9 (e.g. 9825012345). No letters or spaces allowed.',
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email address is required for portal login.')
    .email('Please input a valid email address (e.g. faculty@sdjmt.edu.in).'),
  address: z.string().optional().or(z.literal('')),
  joinDate: z.string().optional().or(z.literal('')),
  employmentType: z.string().default('PERMANENT'),
  photoUrl: z.string().optional().or(z.literal('')),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  initialData?: any | null;
}

const StaffFormModal: React.FC<StaffFormModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: 'Male',
      dob: '',
      designation: 'TEACHER',
      departmentId: '',
      phone: '',
      email: '',
      address: '',
      joinDate: '',
      employmentType: 'PERMANENT',
      photoUrl: '',
    },
  });

  const formData = watch();
  const formDraftKey = initialData?.id ? `sdjm_staff_edit_${initialData.id}` : 'sdjm_staff_draft';

  // Warn on accidental tab close or page refresh when modal is open and has unsaved edits
  useUnsavedWarning(
    isOpen && (isDirty || !!formData.firstName),
    'You have unsubmitted changes in the staff form. Are you sure you want to refresh? Your entered form draft has been preserved.'
  );

  // Auto-save draft for new onboarding only (not edit to prevent overwriting server source of truth)
  useEffect(() => {
    if (isOpen && !initialData && (formData.firstName || formData.lastName || formData.phone || formData.email)) {
      StorageService.set(formDraftKey, formData, 'local');
      setDraftSaved(true);
      const timer = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, formDraftKey, isOpen, initialData]);

  // Fetch departments list
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/settings');
        const deptList = res.data?.data?.departments || [];
        if (deptList.length > 0) {
          setDepartments(deptList);
        } else {
          setDepartments([
            { id: 'dept_1', name: 'Commerce & Accounts' },
            { id: 'dept_2', name: 'Languages & Humanities' },
            { id: 'dept_3', name: 'Administration & Secretarial' },
          ]);
        }
      } catch (e) {
        setDepartments([
          { id: 'dept_1', name: 'Commerce & Accounts' },
          { id: 'dept_2', name: 'Languages & Humanities' },
          { id: 'dept_3', name: 'Administration & Secretarial' },
        ]);
      }
    };
    if (isOpen) {
      fetchDepts();
    }
  }, [isOpen]);

  const populateFields = useCallback((source: any) => {
    if (!source) return;

    let formattedDob = '';
    if (source.dob) {
      try {
        const d = new Date(source.dob);
        if (!isNaN(d.getTime())) {
          formattedDob = d.toISOString().split('T')[0];
        }
      } catch (e) {}
    }

    let formattedJoinDate = '';
    if (source.joinDate) {
      try {
        const d = new Date(source.joinDate);
        if (!isNaN(d.getTime())) {
          formattedJoinDate = d.toISOString().split('T')[0];
        }
      } catch (e) {}
    }

    const cleanPhone = (source.phone || source.user?.phone || '').replace(/\D/g, '');
    const cleanEmail = source.email || source.user?.email || '';
    const targetDeptId = source.departmentId || source.department?.id || '';

    const populatedValues: StaffFormData = {
      firstName: source.firstName || '',
      lastName: source.lastName || '',
      gender: source.gender || 'Male',
      dob: formattedDob,
      designation: source.designation || 'TEACHER',
      departmentId: targetDeptId,
      phone: cleanPhone,
      email: cleanEmail,
      address: source.address || '',
      joinDate: formattedJoinDate,
      employmentType: source.employmentType || 'PERMANENT',
      photoUrl: source.photoUrl || '',
    };

    reset(populatedValues);

    if (source.photoUrl) {
      setPhotoPreview(getFullPhotoUrl(source.photoUrl));
    } else {
      setPhotoPreview(null);
    }
    setPhotoFile(null);
  }, [reset]);

  const handleDiscardDraft = () => {
    StorageService.remove(formDraftKey, 'local');
    setDraftRestored(false);
    if (initialData) {
      populateFields(initialData);
    } else {
      setPhotoPreview(null);
      setPhotoFile(null);
      reset({
        firstName: '',
        lastName: '',
        gender: 'Male',
        dob: '',
        designation: 'TEACHER',
        departmentId: departments[0]?.id || '',
        phone: '',
        email: '',
        address: '',
        joinDate: new Date().toISOString().split('T')[0],
        employmentType: 'PERMANENT',
        photoUrl: '',
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setServerError(null);

    if (initialData) {
      // 1. Immediately prefill from initialData passed from props (no blank delay)
      populateFields(initialData);

      // 2. Fetch latest full details from backend API to ensure 100% complete fresh data
      if (initialData.id) {
        setLoadingDetails(true);
        api
          .get(`/staff/${initialData.id}`)
          .then((res) => {
            if (res.data?.data) {
              populateFields(res.data.data);
            }
          })
          .catch((err) => {
            console.warn('Using prop initialData for staff form:', err);
          })
          .finally(() => {
            setLoadingDetails(false);
          });
      }
    } else {
      setPhotoPreview(null);
      setPhotoFile(null);

      const savedDraft = StorageService.get<StaffFormData | null>('sdjm_staff_draft', null, 'local');
      if (savedDraft && (savedDraft.firstName || savedDraft.email || savedDraft.phone)) {
        reset(savedDraft);
        setDraftRestored(true);
        if (savedDraft.photoUrl) setPhotoPreview(getFullPhotoUrl(savedDraft.photoUrl));
      } else {
        setDraftRestored(false);
        reset({
          firstName: '',
          lastName: '',
          gender: 'Male',
          dob: '',
          designation: 'TEACHER',
          departmentId: departments[0]?.id || '',
          phone: '',
          email: '',
          address: '',
          joinDate: new Date().toISOString().split('T')[0],
          employmentType: 'PERMANENT',
          photoUrl: '',
        });
      }
    }
  }, [isOpen, initialData, populateFields, reset, departments]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setServerError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setServerError('Photo size must be under 5MB.');
      return;
    }

    setServerError(null);
    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const uploadData = new FormData();
      uploadData.append('photo', file);
      const res = await api.post('/upload/photo?folder=djmhs_staff', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.data?.photoUrl) {
        setValue('photoUrl', res.data.data.photoUrl);
        setPhotoPreview(getFullPhotoUrl(res.data.data.photoUrl));
        setPhotoFile(null);
      }
    } catch (err: any) {
      console.warn('Direct upload notice:', err);
      setPhotoFile(file);
      if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      }
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setValue('photoUrl', '');
  };

  const onSubmit = async (data: StaffFormData) => {
    setSubmitting(true);
    setServerError(null);
    try {
      // Clean phone and names before payload dispatch
      const sanitizedData = {
        ...data,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.replace(/\D/g, ''),
        email: data.email.trim().toLowerCase(),
        address: data.address ? data.address.trim() : '',
      };

      let response;
      if (photoFile) {
        const formDataPayload = new FormData();
        Object.entries(sanitizedData).forEach(([key, val]) => {
          if (val !== undefined && val !== null) formDataPayload.append(key, String(val));
        });
        formDataPayload.append('photo', photoFile);

        if (initialData?.id) {
          response = await api.put(`/staff/${initialData.id}`, formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          response = await api.post('/staff', formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        if (initialData?.id) {
          response = await api.put(`/staff/${initialData.id}`, sanitizedData);
        } else {
          response = await api.post('/staff', sanitizedData);
        }
      }

      StorageService.remove(formDraftKey, 'local');
      setDraftRestored(false);
      onSuccess(response.data.data || sanitizedData);
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to save faculty record. Please check mobile, email or department fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Update Faculty Record: ${initialData.empId || 'Faculty Profile'}` : 'Onboard New Institutional Staff'}
      subtitle="Manage faculty profile, credentials, department alignment, and photograph asset."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {loadingDetails && (
          <div className="p-2.5 rounded-xl bg-primary-50 text-primary-700 border border-primary-200 text-xs font-bold flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading complete faculty details from server...</span>
          </div>
        )}

        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
            <span>⚠️ {serverError}</span>
            <button type="button" onClick={() => setServerError(null)} className="text-rose-600 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {draftRestored && !initialData && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>In-progress faculty draft restored from your active session.</span>
            </div>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" /> Discard Draft
            </button>
          </div>
        )}

        {draftSaved && (
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <span>💾 Draft progress auto-saved locally.</span>
            <Check className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Photo Upload Area */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group flex-shrink-0">
            {photoPreview ? (
              <img src={photoPreview} alt="Staff Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-500 shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                <Camera className="w-6 h-6" />
                <span className="text-[9px] font-bold mt-1">No Photo</span>
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white text-[10px] font-bold">
                Uploading...
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5 text-center sm:text-left">
            <label className="block text-xs font-black text-slate-800">Faculty Identity Photograph</label>
            <p className="text-[11px] text-slate-500">Upload a formal passport photograph (JPEG/PNG/WebP, max 5MB). Asset will be stored securely.</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <label className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{photoPreview ? 'Replace Photo' : 'Upload Photo'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
              </label>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs inline-flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">First Name *</label>
            <input
              type="text"
              {...register('firstName', {
                onChange: (e) => {
                  const clean = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
                  if (clean !== e.target.value) {
                    setValue('firstName', clean, { shouldValidate: true, shouldDirty: true });
                  }
                },
              })}
              placeholder="e.g. Rajeshbhai"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
            />
            {errors.firstName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Last Name *</label>
            <input
              type="text"
              {...register('lastName', {
                onChange: (e) => {
                  const clean = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
                  if (clean !== e.target.value) {
                    setValue('lastName', clean, { shouldValidate: true, shouldDirty: true });
                  }
                },
              })}
              placeholder="e.g. Patel"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
            />
            {errors.lastName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Gender *</label>
            <select {...register('gender')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.gender.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Date of Birth *</label>
            <input
              type="date"
              {...register('dob')}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
            />
            {errors.dob && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.dob.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Designation *</label>
            <select
              {...register('designation')}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="TEACHER">Teacher / Faculty</option>
              <option value="HOD">Head of Department (HOD)</option>
              <option value="CLASS_TEACHER">Class Teacher</option>
              <option value="PRINCIPAL">Principal</option>
              <option value="VICE_PRINCIPAL">Vice Principal</option>
              <option value="OFFICE_ADMIN">Office Administrator</option>
              <option value="NON_TEACHING_STAFF">Non-Teaching Staff</option>
            </select>
            {errors.designation && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.designation.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Department Wing *</label>
            <select {...register('departmentId')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500">
              <option value="">-- Select Department --</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.departmentId && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.departmentId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Joining Date</label>
            <input
              type="date"
              {...register('joinDate')}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Employment Type</label>
            <select {...register('employmentType')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500">
              <option value="PERMANENT">Permanent</option>
              <option value="CONTRACT">Contractual</option>
              <option value="PART_TIME">Part-Time</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Mobile Contact (10 Digits) *</label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                {...register('phone', {
                  onChange: (e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setValue('phone', clean, { shouldValidate: true, shouldDirty: true });
                  },
                })}
                placeholder="e.g. 9825012345"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.phone.message}</p>}
            <p className="text-[10px] text-slate-400 mt-0.5">Strictly 10 digits without spaces or characters (starts with 6-9).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Address (Login ID) *</label>
            <input
              type="email"
              {...register('email', {
                onChange: (e) => {
                  const clean = e.target.value.trim().toLowerCase();
                  if (clean !== e.target.value) {
                    setValue('email', clean, { shouldValidate: true, shouldDirty: true });
                  }
                },
              })}
              placeholder="e.g. rajesh.patel@sdjmt.edu.in"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
            />
            {errors.email && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary-600" /> Residential Address
          </label>
          <input
            type="text"
            {...register('address')}
            placeholder="Street, City, District, State, Pincode"
            className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              if (!initialData) localStorage.removeItem('sdjm_staff_draft');
              reset();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingPhoto}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs transition shadow-lg shadow-primary-600/30 flex items-center gap-2 disabled:opacity-60"
          >
            {submitting ? 'Saving Faculty Record...' : initialData ? 'Save Changes' : 'Onboard Faculty & Send Credentials'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StaffFormModal;
