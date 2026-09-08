import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import { Users, Check, Shield, Upload, Trash2, Camera, MapPin, Building2, CheckCircle2, Phone, Mail, AlertCircle, Sparkles, RotateCcw } from 'lucide-react';
import StorageService from '../../utils/storage.utils';
import useUnsavedWarning from '../../utils/useUnsavedWarning';

const phoneRegex = /^[6-9]\d{9}$/;
const nameRegex = /^[a-zA-Z\s.'-]+$/;

const studentSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters.')
    .max(50, 'First name cannot exceed 50 characters.')
    .regex(nameRegex, 'First name should only contain alphabets and valid punctuation (e.g. Parthiv).'),
  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters.')
    .max(50, 'Last name cannot exceed 50 characters.')
    .regex(nameRegex, 'Last name should only contain alphabets (e.g. Mehta).'),
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
      return age >= 3 && age <= 25;
    }, 'Date of birth must be a realistic birth date for an enrolled student (between 3 and 25 years old).'),
  divisionId: z.string().min(1, 'Please assign an academic standard and classroom division.'),
  rollNumber: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      return /^[0-9a-zA-Z-]+$/.test(val.trim());
    }, 'Roll number can only contain numbers or letters without spaces (e.g. 01, 24).'),
  bloodGroup: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergencyContact: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const clean = val.replace(/\D/g, '');
      return clean.length === 10 && phoneRegex.test(clean);
    }, 'Emergency contact must be a valid 10-digit mobile number starting with 6, 7, 8, or 9 (e.g. 9825099999).'),
  allergies: z.string().optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
  parentFirstName: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      return val.trim().length >= 2 && nameRegex.test(val.trim());
    }, 'Guardian first name should only contain alphabets.'),
  parentLastName: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      return nameRegex.test(val.trim());
    }, 'Guardian last name should only contain alphabets.'),
  parentPhone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const clean = val.replace(/\D/g, '');
      return clean.length === 10 && phoneRegex.test(clean);
    }, 'Guardian mobile number must be exactly 10 digits starting with 6, 7, 8, or 9 (e.g. 9825012345). No letters or spaces allowed.'),
  parentEmail: z
    .string()
    .trim()
    .email('Please input a valid email address (e.g. guardian@gmail.com).')
    .optional()
    .or(z.literal('')),
  relationship: z.string().default('Father'),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StandardWithDivisions {
  id: string;
  name: string;
  level: number;
  divisions: Array<{
    id: string;
    name: string;
    roomNumber?: string;
    capacity?: number;
  }>;
}

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  initialData?: any | null;
  defaultStandardId?: string;
  defaultDivisionId?: string;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultStandardId,
  defaultDivisionId,
}) => {
  const [standards, setStandards] = useState<StandardWithDivisions[]>([]);
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
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: 'Male',
      dob: '',
      divisionId: '',
      rollNumber: '',
      bloodGroup: '',
      address: '',
      emergencyContact: '',
      allergies: '',
      photoUrl: '',
      parentFirstName: '',
      parentLastName: '',
      parentPhone: '',
      parentEmail: '',
      relationship: 'Father',
    },
  });

  const formData = watch();
  const selectedDivisionId = watch('divisionId');

  // Warn on accidental tab close or page refresh when modal is open and has unsaved edits
  useUnsavedWarning(isOpen && (isDirty || !!formData.firstName), 'You have unsubmitted changes in the student form. Are you sure you want to refresh? Your entered form draft has been preserved.');

  const formDraftKey = initialData?.id ? `sdjm_student_edit_${initialData.id}` : 'sdjm_student_draft';

  // Auto-save draft for new enrollments and student edits
  useEffect(() => {
    if (isOpen && (formData.firstName || formData.lastName || formData.parentPhone)) {
      StorageService.set(formDraftKey, formData, 'local');
      setDraftSaved(true);
      const timer = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, formDraftKey, isOpen]);

  // Fetch all Standards and Divisions
  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.data?.standards && Array.isArray(res.data.data.standards)) {
          setStandards(res.data.data.standards);
        }
      } catch (e) {
        console.warn('Fallback standards applied', e);
        setStandards([
          { id: 'std_09', name: 'Standard 09', level: 9, divisions: [{ id: 'div_09a', name: 'A', roomNumber: 'Room 201-East' }] },
          { id: 'std_10', name: 'Standard 10', level: 10, divisions: [{ id: 'div_10a', name: 'A', roomNumber: 'Room 101-North' }] },
          { id: 'std_11', name: 'Standard 11 Commerce', level: 11, divisions: [{ id: 'div_11a', name: 'A', roomNumber: 'Room 301-South' }] },
          { id: 'std_12', name: 'Standard 12 Commerce', level: 12, divisions: [{ id: 'div_12a', name: 'A', roomNumber: 'Room 302-South' }] },
        ]);
      }
    };

    if (isOpen) {
      fetchStandards();
    }
  }, [isOpen]);

  const populateFields = (source: any) => {
    if (!source) return;

    const pMapping = source.parents?.[0];
    const p = pMapping?.parent || source.parent;
    const parentFullName = (
      p?.fatherName ||
      p?.motherName ||
      p?.guardianName ||
      [p?.firstName, p?.lastName].filter(Boolean).join(' ') ||
      ''
    ).trim();

    const nameParts = parentFullName.split(/\s+/).filter(Boolean);
    const parentFirstName = nameParts[0] || p?.firstName || '';
    const parentLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : (p?.lastName || '');
    const parentPhone =
      (p?.phone || p?.user?.phone || (p?.user?.identifier && !p?.user?.identifier.includes('@') ? p?.user?.identifier : '') || '').replace(/\D/g, '');
    const parentEmail =
      p?.email || p?.user?.email || (p?.user?.identifier && p?.user?.identifier.includes('@') ? p?.user?.identifier : '') || '';
    const relationship = pMapping?.relationship || p?.relationship || 'Father';
    const studentAddress = source.address || p?.address || '';
    const targetDivisionId = source.divisionId || source.division?.id || defaultDivisionId || '';

    let formattedDob = '';
    if (source.dob) {
      try {
        const d = new Date(source.dob);
        if (!isNaN(d.getTime())) {
          formattedDob = d.toISOString().split('T')[0];
        }
      } catch (e) {}
    }

    setPhotoPreview(source.photoUrl || null);
    setPhotoFile(null);

    reset({
      firstName: source.firstName || '',
      lastName: source.lastName || '',
      gender: source.gender || 'Male',
      dob: formattedDob,
      divisionId: targetDivisionId,
      rollNumber: source.rollNumber ? String(source.rollNumber) : '',
      bloodGroup: source.bloodGroup || '',
      address: studentAddress,
      emergencyContact: (source.emergencyContact || '').replace(/\D/g, ''),
      allergies: source.allergies || '',
      photoUrl: source.photoUrl || '',
      parentFirstName,
      parentLastName,
      parentPhone,
      parentEmail,
      relationship,
    });

    if (targetDivisionId) {
      setValue('divisionId', targetDivisionId);
    }
  };

  const handleDiscardDraft = () => {
    StorageService.remove(formDraftKey, 'local');
    setDraftRestored(false);
    if (initialData) {
      populateFields(initialData);
    } else {
      reset({
        firstName: '',
        lastName: '',
        gender: 'Male',
        dob: '',
        divisionId: defaultDivisionId || '',
        rollNumber: '',
        bloodGroup: '',
        address: '',
        emergencyContact: '',
        allergies: '',
        photoUrl: '',
        parentFirstName: '',
        parentLastName: '',
        parentPhone: '',
        parentEmail: '',
        relationship: 'Father',
      });
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const savedEditDraft = StorageService.get<StudentFormData | null>(`sdjm_student_edit_${initialData.id}`, null, 'local');
      if (savedEditDraft && savedEditDraft.firstName) {
        reset(savedEditDraft);
        setDraftRestored(true);
        if (savedEditDraft.photoUrl) setPhotoPreview(savedEditDraft.photoUrl);
      } else {
        setDraftRestored(false);
        populateFields(initialData);

        if (initialData.id) {
          setLoadingDetails(true);
          api
            .get(`/students/${initialData.id}`)
            .then((res) => {
              if (res.data?.data) {
                populateFields(res.data.data);
              }
            })
            .catch((err) => console.warn('Could not fetch deep student details:', err))
            .finally(() => setLoadingDetails(false));
        }
      }
    } else {
      setPhotoPreview(null);
      setPhotoFile(null);
      setServerError(null);

      const savedDraft = StorageService.get<StudentFormData | null>('sdjm_student_draft', null, 'local');
      if (savedDraft && (savedDraft.firstName || savedDraft.parentPhone)) {
        reset(savedDraft);
        setDraftRestored(true);
        if (savedDraft.photoUrl) setPhotoPreview(savedDraft.photoUrl);
        return;
      }

      setDraftRestored(false);
      reset({
        firstName: '',
        lastName: '',
        gender: 'Male',
        dob: '',
        divisionId: defaultDivisionId || '',
        rollNumber: '',
        bloodGroup: '',
        address: '',
        emergencyContact: '',
        allergies: '',
        photoUrl: '',
        parentFirstName: '',
        parentLastName: '',
        parentPhone: '',
        parentEmail: '',
        relationship: 'Father',
      });
    }
  }, [isOpen, initialData, defaultDivisionId, reset]);

  // Synchronize division selection when standards finish loading
  useEffect(() => {
    if (standards.length > 0) {
      const targetDivId = initialData?.divisionId || initialData?.division?.id || defaultDivisionId;
      if (targetDivId) {
        setValue('divisionId', targetDivId, { shouldValidate: true });
      }
    }
  }, [standards, initialData, defaultDivisionId, setValue]);

  const getSelectedDivisionInfo = () => {
    if (!selectedDivisionId) return null;
    for (const std of standards) {
      const foundDiv = std.divisions?.find((d) => d.id === selectedDivisionId);
      if (foundDiv) {
        return {
          standardName: std.name,
          standardLevel: std.level,
          divisionName: foundDiv.name,
          roomNumber: foundDiv.roomNumber || 'Room N/A',
        };
      }
    }
    return null;
  };

  const selectedDivInfo = getSelectedDivisionInfo();

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
      const res = await api.post('/upload/photo?folder=djmhs_students', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.data?.photoUrl) {
        setValue('photoUrl', res.data.data.photoUrl);
        setPhotoPreview(res.data.data.photoUrl);
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

  const onSubmit = async (data: StudentFormData) => {
    setSubmitting(true);
    setServerError(null);

    // Clean and sanitize string data
    const cleanPayload: StudentFormData = {
      ...data,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      parentFirstName: data.parentFirstName ? data.parentFirstName.trim() : '',
      parentLastName: data.parentLastName ? data.parentLastName.trim() : '',
      parentPhone: data.parentPhone ? data.parentPhone.replace(/\D/g, '') : '',
      emergencyContact: data.emergencyContact ? data.emergencyContact.replace(/\D/g, '') : '',
      parentEmail: data.parentEmail ? data.parentEmail.trim().toLowerCase() : '',
      rollNumber: data.rollNumber ? data.rollNumber.trim() : '',
      address: data.address ? data.address.trim() : '',
      allergies: data.allergies ? data.allergies.trim() : '',
      bloodGroup: data.bloodGroup ? data.bloodGroup.trim() : '',
    };

    try {
      let response;
      if (photoFile) {
        const formDataPayload = new FormData();
        Object.entries(cleanPayload).forEach(([key, val]) => {
          if (val !== undefined && val !== null) formDataPayload.append(key, String(val));
        });
        formDataPayload.append('photo', photoFile);

        if (initialData?.id) {
          response = await api.put(`/students/${initialData.id}`, formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          response = await api.post('/students', formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        if (initialData?.id) {
          response = await api.put(`/students/${initialData.id}`, cleanPayload);
        } else {
          response = await api.post('/students', cleanPayload);
        }
      }

      StorageService.remove(formDraftKey, 'local');
      setDraftRestored(false);
      onSuccess(response.data.data || cleanPayload);
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to save student record. Please verify all information.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Pupil: ${initialData.firstName} ${initialData.lastName}` : 'Student Admission & Onboarding'}
      subtitle={initialData ? `GR Number: ${initialData.grNumber || 'N/A'} — Modify personal records, assigned class, and guardian contacts.` : 'Enroll a pupil into the General Register with automatic GR numbering and sibling linkage.'}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {serverError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
            <button type="button" onClick={() => setServerError(null)} className="text-rose-600 font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {draftRestored && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>In-progress form draft restored from your active session. You can continue editing or discard.</span>
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
            <span>💾 Form draft auto-saved to local browser storage.</span>
            <Check className="w-3.5 h-3.5" />
          </div>
        )}

        {loadingDetails && (
          <div className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-ping"></span>
            <span>Refreshing comprehensive student record from database...</span>
          </div>
        )}

        {/* Section 1: Photo & Pupil Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary-600" /> Pupil Identity & Biological Details
            </h4>
            {initialData?.grNumber && (
              <span className="px-2.5 py-0.5 rounded-md bg-primary-100 text-primary-900 font-mono font-extrabold text-xs">
                GR: {initialData.grNumber}
              </span>
            )}
          </div>

          {/* Photo Asset Upload Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group flex-shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Student Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-500 shadow-md" />
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
              <label className="block text-xs font-black text-slate-800">Pupil Identity Photograph</label>
              <p className="text-[11px] text-slate-500">Official student photograph for ID cards and General Register (JPEG/PNG/WebP, max 5MB).</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoPreview ? 'Replace Photograph' : 'Upload Photograph'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
                </label>
                {photoPreview && (
                  <button type="button" onClick={handleRemovePhoto} className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs inline-flex items-center gap-1 transition">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">First Name *</label>
              <input
                type="text"
                {...register('firstName')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
                  setValue('firstName', val, { shouldValidate: true });
                }}
                placeholder="e.g. Parthiv"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
              />
              {errors.firstName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Last Name *</label>
              <input
                type="text"
                {...register('lastName')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
                  setValue('lastName', val, { shouldValidate: true });
                }}
                placeholder="e.g. Mehta"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
              />
              {errors.lastName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Gender *</label>
              <select {...register('gender')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500 font-medium">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Date of Birth *</label>
              <input type="date" {...register('dob')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium" />
              {errors.dob && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.dob.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Blood Group</label>
              <select {...register('bloodGroup')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500 font-medium">
                <option value="">-- Select Blood Group --</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Roll Number</label>
              <input
                type="text"
                {...register('rollNumber')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9a-zA-Z-]/g, '').slice(0, 8);
                  setValue('rollNumber', val, { shouldValidate: true });
                }}
                placeholder="e.g. 01"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500"
              />
              {errors.rollNumber && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.rollNumber.message}</p>}
            </div>
          </div>

          {/* Assigned Standard & Classroom Division Picker */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary-600" /> Assigned Standard & Classroom Division *
              </span>
              <span className="text-[10px] text-slate-500 normal-case font-semibold">Bhavnagar High School & Commerce Streams</span>
            </label>

            <select
              {...register('divisionId')}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500 font-semibold text-slate-800 shadow-xs"
            >
              <option value="">-- Choose Standard Tier & Classroom Division --</option>
              {standards.map((std) => (
                <optgroup key={std.id} label={`${std.name} (Grade Level ${std.level})`}>
                  {std.divisions?.map((div: any) => (
                    <option key={div.id} value={div.id}>
                      {std.name} — Division {div.name} {div.roomNumber ? `(Classroom: ${div.roomNumber})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {errors.divisionId && <p className="text-red-500 text-[11px] font-semibold">{errors.divisionId.message}</p>}

            {selectedDivInfo && (
              <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-950 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Classroom Allocation: <strong>{selectedDivInfo.standardName} — Division {selectedDivInfo.divisionName}</strong> ({selectedDivInfo.roomNumber})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Emergency Contact Mobile
              </label>
              <input
                type="text"
                maxLength={10}
                {...register('emergencyContact')}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setValue('emergencyContact', val, { shouldValidate: true });
                }}
                placeholder="e.g. 9825099999 (10 digits)"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 font-medium"
              />
              {errors.emergencyContact && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.emergencyContact.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Medical Allergies / Conditions</label>
              <input
                type="text"
                {...register('allergies')}
                placeholder="e.g. Asthma, Penicillin Allergy (or None)"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary-600" /> Residential Address
            </label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="House / Flat No, Street, Area, City, District, State, Pincode (e.g. Crescent Circle, Bhavnagar, Gujarat - 364001)"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
            ></textarea>
          </div>
        </div>

        {/* Section 2: Guardian & Sibling Mapping */}
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-600" /> Primary Guardian Information & Sibling Linkage</span>
            <span className="text-[10px] text-primary-700 font-extrabold uppercase bg-primary-50 px-2 py-0.5 rounded border border-primary-200">Parent Portal Enabled</span>
          </h4>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
            💡 <strong>Smart Sibling Linkage:</strong> Entering or updating the 10-digit Guardian Mobile number below links this student to the parent's portal account and enables the <strong>Sibling Switcher</strong>.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Guardian First Name</label>
              <input
                type="text"
                {...register('parentFirstName')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
                  setValue('parentFirstName', val, { shouldValidate: true });
                }}
                placeholder="e.g. Arvindbhai"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
              />
              {errors.parentFirstName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.parentFirstName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Guardian Last Name</label>
              <input
                type="text"
                {...register('parentLastName')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
                  setValue('parentLastName', val, { shouldValidate: true });
                }}
                placeholder="e.g. Mehta"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
              />
              {errors.parentLastName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.parentLastName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Relationship</label>
              <select {...register('relationship')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500 font-medium">
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Guardian Mobile (Strict 10 Digits)
              </label>
              <input
                type="text"
                maxLength={10}
                {...register('parentPhone')}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setValue('parentPhone', val, { shouldValidate: true });
                }}
                placeholder="e.g. 9825012345 (Numbers only)"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 font-medium"
              />
              {errors.parentPhone && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.parentPhone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Guardian Email (Optional Portal Login)
              </label>
              <input
                type="email"
                {...register('parentEmail')}
                placeholder="e.g. arvind.mehta@gmail.com"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
              />
              {errors.parentEmail && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.parentEmail.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('sdjm_student_draft');
              reset();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingPhoto}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Saving Pupil Record...' : (initialData ? 'Save Changes' : 'Confirm Admission & Dispatch Credentials')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentFormModal;
