import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import { UserPlus, Save, Check, Upload, Trash2, Camera, MapPin } from 'lucide-react';

const staffSchema = z.object({
  firstName: z.string().min(2, 'First name is mandatory.'),
  lastName: z.string().min(2, 'Last name is mandatory.'),
  gender: z.string().min(1, 'Please select gender.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  designation: z.string().min(2, 'Designation required (e.g., HOD, Teacher).'),
  departmentId: z.string().min(1, 'Please select faculty department.'),
  phone: z.string().length(10, 'Mobile contact must be 10 digits.'),
  email: z.string().email('Please input valid email address.'),
  address: z.string().optional(),
  joinDate: z.string().optional(),
  employmentType: z.string().optional(),
  photoUrl: z.string().optional(),
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
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
  useEffect(() => {
    if (!initialData && isOpen && formData.firstName) {
      localStorage.setItem('sdjm_staff_draft', JSON.stringify(formData));
      setDraftSaved(true);
      const timer = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, initialData, isOpen]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/settings');
        setDepartments(res.data.data.departments || [
          { id: 'dept_1', name: 'Commerce & Accounts' },
          { id: 'dept_2', name: 'Languages & Humanities' },
          { id: 'dept_3', name: 'Administration & Secretarial' }
        ]);
      } catch (e) {
        setDepartments([
          { id: 'dept_1', name: 'Commerce & Accounts' },
          { id: 'dept_2', name: 'Languages & Humanities' },
          { id: 'dept_3', name: 'Administration & Secretarial' }
        ]);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setPhotoPreview(initialData.photoUrl || null);
        setPhotoFile(null);
        reset({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          gender: initialData.gender || 'Male',
          dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
          designation: initialData.designation || 'TEACHER',
          departmentId: initialData.departmentId || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          address: initialData.address || '',
          joinDate: initialData.joinDate ? new Date(initialData.joinDate).toISOString().split('T')[0] : '',
          employmentType: initialData.employmentType || 'PERMANENT',
          photoUrl: initialData.photoUrl || '',
        });
      } else {
        setPhotoPreview(null);
        setPhotoFile(null);
        reset({
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
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const [serverError, setServerError] = useState<string | null>(null);

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

  const onSubmit = async (data: StaffFormData) => {
    setSubmitting(true);
    setServerError(null);
    try {
      let response;
      if (photoFile) {
        const formDataPayload = new FormData();
        Object.entries(data).forEach(([key, val]) => {
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
          response = await api.put(`/staff/${initialData.id}`, data);
        } else {
          response = await api.post('/staff', data);
        }
      }

      localStorage.removeItem('sdjm_staff_draft');
      onSuccess(response.data.data || data);
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to onboard staff member. Please check email/phone or department.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Update Faculty Record: ${initialData.empId}` : 'Onboard New Institutional Staff'}
      subtitle="Manage faculty profile, credentials, department alignment, and photograph asset."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
            <span>⚠️ {serverError}</span>
            <button type="button" onClick={() => setServerError(null)} className="text-rose-600 font-bold hover:underline">Dismiss</button>
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
            <p className="text-[11px] text-slate-500">Upload a formal passport photograph (JPEG/PNG/WebP, max 5MB). Asset will be stored in Cloudinary.</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <label className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{photoPreview ? 'Replace Photo' : 'Upload Photo'}</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">First Name *</label>
            <input
              type="text"
              {...register('firstName')}
              placeholder="e.g. Rajeshbhai"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
            />
            {errors.firstName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Last Name *</label>
            <input
              type="text"
              {...register('lastName')}
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
            <input
              type="text"
              maxLength={10}
              {...register('phone')}
              placeholder="e.g. 9825098250"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500"
            />
            {errors.phone && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Address (Login ID) *</label>
            <input
              type="email"
              {...register('email')}
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
            onClick={() => { localStorage.removeItem('sdjm_staff_draft'); reset(); onClose(); }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingPhoto}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs transition shadow-lg shadow-primary-600/30 flex items-center gap-2 disabled:opacity-60"
          >
            {submitting ? 'Saving Faculty Record...' : (initialData ? 'Save Changes' : 'Onboard Faculty & Send Credentials')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StaffFormModal;
