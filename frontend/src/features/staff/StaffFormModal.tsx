import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import {
  UserPlus,
  Save,
  Check,
  Upload,
  Trash2,
  Camera,
  MapPin,
  Sparkles,
  RotateCcw,
  Phone,
  Mail,
  AlertCircle,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Plus,
  X,
  Layers,
  School,
  CheckCircle2,
} from 'lucide-react';
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

export interface SubjectAllocation {
  subjectId: string;
  divisionId: string;
  standardName?: string;
  divisionName?: string;
  subjectName?: string;
  subjectCode?: string;
}

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  initialData?: any | null;
}

const StaffFormModal: React.FC<StaffFormModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [standards, setStandards] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Class Teacher Assignment State
  const [classTeacherDivisionId, setClassTeacherDivisionId] = useState<string>('');

  // Multi-Subject Allocation State
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([]);
  const [allocStandardId, setAllocStandardId] = useState<string>('');
  const [allocDivisionId, setAllocDivisionId] = useState<string>('ALL');
  const [allocSubjectId, setAllocSubjectId] = useState<string>('');
  const [allocMsg, setAllocMsg] = useState<string | null>(null);

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
  const watchedDesignation = formData.designation || 'TEACHER';
  const isTeachingRole = ['TEACHER', 'CLASS_TEACHER', 'HOD'].includes(watchedDesignation);
  const isClassTeacher = watchedDesignation === 'CLASS_TEACHER';

  const formDraftKey = initialData?.id ? `sdjm_staff_edit_${initialData.id}` : 'sdjm_staff_draft';

  // Warn on accidental tab close or page refresh when modal is open and has unsaved edits
  useUnsavedWarning(
    isOpen && (isDirty || !!formData.firstName || subjectAllocations.length > 0 || !!classTeacherDivisionId),
    'You have unsubmitted changes in the staff form. Are you sure you want to refresh? Your entered form draft has been preserved.'
  );

  // Auto-save draft for new onboarding only (not edit to prevent overwriting server source of truth)
  useEffect(() => {
    if (isOpen && !initialData && (formData.firstName || formData.lastName || formData.phone || formData.email || subjectAllocations.length > 0 || classTeacherDivisionId)) {
      const draftPayload = {
        formData,
        classTeacherDivisionId,
        subjectAllocations,
      };
      StorageService.set(formDraftKey, draftPayload, 'local');
      setDraftSaved(true);
      const timer = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, classTeacherDivisionId, subjectAllocations, formDraftKey, isOpen, initialData]);

  // Fetch departments and standards list
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        const deptList = res.data?.data?.departments || [];
        const stdList = res.data?.data?.standards || [];

        if (deptList.length > 0) {
          setDepartments(deptList);
        } else {
          setDepartments([
            { id: 'dept_1', name: 'Commerce & Accounts' },
            { id: 'dept_2', name: 'Languages & Humanities' },
            { id: 'dept_3', name: 'Administration & Secretarial' },
          ]);
        }

        if (stdList.length > 0) {
          setStandards(stdList);
          if (!allocStandardId) {
            setAllocStandardId(stdList[0].id);
          }
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
      fetchSettings();
    }
  }, [isOpen]);

  // Set default allocation standard when standards load
  useEffect(() => {
    if (standards.length > 0 && !allocStandardId) {
      setAllocStandardId(standards[0].id);
    }
  }, [standards, allocStandardId]);

  const activeStandard = useMemo(() => {
    return standards.find((s) => s.id === allocStandardId) || standards[0] || null;
  }, [standards, allocStandardId]);

  // Auto-select first subject when active standard changes
  useEffect(() => {
    if (activeStandard && activeStandard.subjects?.length > 0) {
      setAllocSubjectId(activeStandard.subjects[0].id);
    } else {
      setAllocSubjectId('');
    }
  }, [activeStandard]);

  const populateFields = useCallback(
    (source: any, currentStandards: any[] = standards) => {
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

      // Populate Class Teacher Division
      const ctDivId =
        source.classTeaching?.[0]?.divisionId ||
        source.classTeacherOf?.[0]?.divisionId ||
        source.classTeacherDivisionId ||
        '';
      setClassTeacherDivisionId(ctDivId);

      // Populate Subject Allocations
      const rawSubs = source.subjectTeaching || source.subjectTeachings || source.subjectAllocations || [];
      if (Array.isArray(rawSubs) && rawSubs.length > 0) {
        const mapped: SubjectAllocation[] = rawSubs.map((st: any) => {
          let stdName = st.division?.standard?.name || st.subject?.standard?.name || '';
          let divName = st.division?.name || '';
          let subName = st.subject?.name || '';
          let subCode = st.subject?.code || '';

          // If relations are missing in raw object, resolve from loaded standards list
          if ((!stdName || !subName) && currentStandards.length > 0) {
            for (const std of currentStandards) {
              const matchedSub = std.subjects?.find((s: any) => s.id === st.subjectId);
              const matchedDiv = std.divisions?.find((d: any) => d.id === st.divisionId);
              if (matchedSub) {
                subName = matchedSub.name;
                subCode = matchedSub.code;
                stdName = std.name;
              }
              if (matchedDiv) {
                divName = matchedDiv.name;
                if (!stdName) stdName = std.name;
              }
            }
          }

          return {
            subjectId: st.subjectId,
            divisionId: st.divisionId,
            standardName: stdName || 'Standard',
            divisionName: divName || 'A',
            subjectName: subName || 'Subject',
            subjectCode: subCode,
          };
        });
        setSubjectAllocations(mapped);
      } else {
        setSubjectAllocations([]);
      }

      if (source.photoUrl) {
        setPhotoPreview(getFullPhotoUrl(source.photoUrl));
      } else {
        setPhotoPreview(null);
      }
      setPhotoFile(null);
    },
    [reset, standards]
  );

  const handleDiscardDraft = () => {
    StorageService.remove(formDraftKey, 'local');
    setDraftRestored(false);
    setClassTeacherDivisionId('');
    setSubjectAllocations([]);
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
      // 1. Prefill from initialData passed from props immediately
      populateFields(initialData);

      // 2. Fetch latest full details from backend API
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

      const savedDraft: any = StorageService.get(formDraftKey, null, 'local');
      if (savedDraft) {
        const draftValues = savedDraft.formData || savedDraft;
        if (draftValues.firstName || draftValues.email || draftValues.phone) {
          reset(draftValues);
          setDraftRestored(true);
          if (draftValues.photoUrl) setPhotoPreview(getFullPhotoUrl(draftValues.photoUrl));
          if (savedDraft.classTeacherDivisionId) setClassTeacherDivisionId(savedDraft.classTeacherDivisionId);
          if (Array.isArray(savedDraft.subjectAllocations)) setSubjectAllocations(savedDraft.subjectAllocations);
          return;
        }
      }

      setDraftRestored(false);
      setClassTeacherDivisionId('');
      setSubjectAllocations([]);
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
  }, [isOpen, initialData, populateFields, reset, departments, formDraftKey]);

  // Handle adding subject allocation
  const handleAddSubjectAllocation = () => {
    if (!activeStandard) {
      setAllocMsg('Please select a standard.');
      setTimeout(() => setAllocMsg(null), 2500);
      return;
    }

    if (!allocSubjectId) {
      setAllocMsg('Please select a subject to assign.');
      setTimeout(() => setAllocMsg(null), 2500);
      return;
    }

    const targetDivisions =
      allocDivisionId === 'ALL' || !allocDivisionId
        ? activeStandard.divisions || []
        : activeStandard.divisions?.filter((d: any) => d.id === allocDivisionId) || [];

    const targetSubjects =
      allocSubjectId === 'ALL'
        ? activeStandard.subjects || []
        : activeStandard.subjects?.filter((s: any) => s.id === allocSubjectId) || [];

    if (targetDivisions.length === 0) {
      setAllocMsg('No divisions available in this standard.');
      setTimeout(() => setAllocMsg(null), 2500);
      return;
    }
    if (targetSubjects.length === 0) {
      setAllocMsg('No subjects available in this standard.');
      setTimeout(() => setAllocMsg(null), 2500);
      return;
    }

    let addedCount = 0;
    setSubjectAllocations((prev) => {
      const updated = [...prev];
      for (const sub of targetSubjects) {
        for (const div of targetDivisions) {
          const exists = updated.some((item) => item.subjectId === sub.id && item.divisionId === div.id);
          if (!exists) {
            updated.push({
              subjectId: sub.id,
              divisionId: div.id,
              standardName: activeStandard.name,
              divisionName: div.name,
              subjectName: sub.name,
              subjectCode: sub.code,
            });
            addedCount++;
          }
        }
      }
      return updated;
    });

    setAllocMsg(`Added ${addedCount > 0 ? addedCount : 'existing'} subject allocation(s).`);
    setTimeout(() => setAllocMsg(null), 2500);
  };

  const handleRemoveSubjectAllocation = (subjectId: string, divisionId: string) => {
    setSubjectAllocations((prev) =>
      prev.filter((item) => !(item.subjectId === subjectId && item.divisionId === divisionId))
    );
  };

  const handleClearAllAllocations = () => {
    setSubjectAllocations([]);
  };

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
      const cleanDesig = data.designation;
      const isTeacherType = ['TEACHER', 'CLASS_TEACHER', 'HOD'].includes(cleanDesig);
      const isClassTeacherRole = cleanDesig === 'CLASS_TEACHER';

      const payloadAllocations = isTeacherType
        ? subjectAllocations.map((s) => ({ subjectId: s.subjectId, divisionId: s.divisionId }))
        : [];

      const payloadClassTeacherDiv = isClassTeacherRole ? classTeacherDivisionId : '';

      const sanitizedData = {
        ...data,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.replace(/\D/g, ''),
        email: data.email.trim().toLowerCase(),
        address: data.address ? data.address.trim() : '',
        classTeacherDivisionId: payloadClassTeacherDiv,
        subjectAllocations: payloadAllocations,
      };

      let response;
      if (photoFile) {
        const formDataPayload = new FormData();
        Object.entries(sanitizedData).forEach(([key, val]) => {
          if (key === 'subjectAllocations') {
            formDataPayload.append(key, JSON.stringify(val));
          } else if (val !== undefined && val !== null) {
            formDataPayload.append(key, String(val));
          }
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
      setServerError(
        err.response?.data?.message || 'Failed to save faculty record. Please check mobile, email or department fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Update Faculty Record: ${initialData.empId || 'Faculty Profile'}` : 'Onboard New Institutional Staff'}
      subtitle="Manage faculty profile, credentials, department alignment, class teacher assignment, and teaching subjects."
      maxWidth="4xl"
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
              <img
                src={photoPreview}
                alt="Staff Preview"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-500 shadow-md"
              />
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
            <p className="text-[11px] text-slate-500">
              Upload a formal passport photograph (JPEG/PNG/WebP, max 5MB). Asset will be stored securely.
            </p>
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

        {/* Primary Faculty Info */}
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
            <select
              {...register('gender')}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500"
            >
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
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500 font-bold text-primary-700"
            >
              <option value="TEACHER">Teacher / Faculty</option>
              <option value="CLASS_TEACHER">Class Teacher</option>
              <option value="HOD">Head of Department (HOD)</option>
              <option value="PRINCIPAL">Principal</option>
              <option value="VICE_PRINCIPAL">Vice Principal</option>
              <option value="OFFICE_ADMIN">Office Administrator</option>
              <option value="NON_TEACHING_STAFF">Non-Teaching Staff</option>
            </select>
            {errors.designation && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.designation.message}</p>}
          </div>
        </div>

        {/* CONDITIONAL SECTION 1: CLASS TEACHER HOMEROOM DROPDOWN */}
        {isClassTeacher && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border-2 border-purple-300 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-purple-950 uppercase tracking-wide">
                    Class Teacher Homeroom Allocation
                  </h4>
                  <p className="text-[11px] text-purple-700">
                    Assign which standard & division this faculty manages as Class Teacher.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-200/80 text-purple-900 font-extrabold text-[10px] uppercase tracking-wider">
                Class Teacher Assigned
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-900 mb-1.5 flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-purple-600" /> Select Class / Standard & Division *
              </label>
              <select
                value={classTeacherDivisionId}
                onChange={(e) => setClassTeacherDivisionId(e.target.value)}
                className="w-full p-2.5 border-2 border-purple-300 rounded-xl text-sm bg-white font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-xs"
              >
                <option value="">-- Select Class (e.g. Standard 10 - Division A) --</option>
                {standards.map((std: any) => (
                  <optgroup key={std.id} label={`${std.name} (${std.stream || 'General Stream'})`}>
                    {std.divisions?.map((div: any) => (
                      <option key={div.id} value={div.id}>
                        {std.name} — Division {div.name} {div.roomNumber ? `(Room ${div.roomNumber})` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {!classTeacherDivisionId && (
                <p className="text-[11px] text-purple-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Please choose the homeroom class division for this class teacher.
                </p>
              )}
            </div>
          </div>
        )}

        {/* CONDITIONAL SECTION 2: MULTI-SUBJECT ALLOCATION MATRIX */}
        {isTeachingRole && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border-2 border-blue-200 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    Faculty Teaching Subjects Allocation
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Assign multiple subjects taught across various standards and divisions.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px]">
                  {subjectAllocations.length} Subject{subjectAllocations.length === 1 ? '' : 's'} Allocated
                </span>
                {subjectAllocations.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllAllocations}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Subject Allocator Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Standard</label>
                <select
                  value={allocStandardId}
                  onChange={(e) => setAllocStandardId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500"
                >
                  {standards.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Division</label>
                <select
                  value={allocDivisionId}
                  onChange={(e) => setAllocDivisionId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Divisions</option>
                  {activeStandard?.divisions?.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      Div {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Subject</label>
                <div className="flex gap-1.5">
                  <select
                    value={allocSubjectId}
                    onChange={(e) => setAllocSubjectId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">-- All Subjects for Standard --</option>
                    {activeStandard?.subjects?.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSubjectAllocation}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs whitespace-nowrap flex items-center gap-1 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>

            {allocMsg && (
              <div className="text-[11px] font-bold text-blue-700 bg-blue-100/60 px-3 py-1 rounded-lg flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-blue-600" /> {allocMsg}
              </div>
            )}

            {/* Quick Toggle Subject Badges for Current Standard */}
            {activeStandard && activeStandard.subjects?.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick-add subjects for {activeStandard.name}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeStandard.subjects.map((sub: any) => {
                    const assignedInAllDivs = (activeStandard.divisions || []).every((d: any) =>
                      subjectAllocations.some((sa) => sa.subjectId === sub.id && sa.divisionId === d.id)
                    );
                    const isPartiallyAssigned = subjectAllocations.some(
                      (sa) => sa.subjectId === sub.id && activeStandard.divisions?.some((d: any) => d.id === sa.divisionId)
                    );

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          if (assignedInAllDivs) {
                            // Remove from all divs of this standard
                            setSubjectAllocations((prev) =>
                              prev.filter(
                                (item) =>
                                  !(
                                    item.subjectId === sub.id &&
                                    activeStandard.divisions?.some((d: any) => d.id === item.divisionId)
                                  )
                              )
                            );
                          } else {
                            // Add to all divs of this standard
                            setSubjectAllocations((prev) => {
                              const updated = [...prev];
                              for (const d of activeStandard.divisions || []) {
                                if (!updated.some((item) => item.subjectId === sub.id && item.divisionId === d.id)) {
                                  updated.push({
                                    subjectId: sub.id,
                                    divisionId: d.id,
                                    standardName: activeStandard.name,
                                    divisionName: d.name,
                                    subjectName: sub.name,
                                    subjectCode: sub.code,
                                  });
                                }
                              }
                              return updated;
                            });
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                          assignedInAllDivs
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : isPartiallyAssigned
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        {assignedInAllDivs ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        <span>{sub.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">({sub.code})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Allocated Subjects Badges Grid */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Current Assigned Teaching Workload ({subjectAllocations.length}):
              </span>
              {subjectAllocations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  {subjectAllocations.map((alloc) => (
                    <div
                      key={`${alloc.subjectId}_${alloc.divisionId}`}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between shadow-2xs group hover:border-blue-300 transition"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-extrabold text-slate-800 truncate">{alloc.subjectName}</div>
                        <div className="text-[10px] font-bold text-primary-700 truncate">
                          {alloc.standardName} (Div {alloc.divisionName})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubjectAllocation(alloc.subjectId, alloc.divisionId)}
                        className="w-5 h-5 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition flex-shrink-0"
                        title="Remove allocation"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                  No subjects allocated yet. Use the controls above to assign multiple subjects to this teacher.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Department, Joining Date & Employment Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Department Wing *</label>
            <select
              {...register('departmentId')}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Select Department --</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
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
            <select
              {...register('employmentType')}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="PERMANENT">Permanent</option>
              <option value="CONTRACT">Contractual</option>
              <option value="PART_TIME">Part-Time</option>
            </select>
          </div>
        </div>

        {/* Contact Details */}
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
            <p className="text-[10px] text-slate-400 mt-0.5">Strictly 10 digits without spaces (starts with 6-9).</p>
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

        {/* Residential Address */}
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

        {/* Action Buttons */}
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
