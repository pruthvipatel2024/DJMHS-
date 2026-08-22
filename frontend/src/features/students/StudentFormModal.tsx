import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import { Users, Check, Shield, Upload, Trash2, Camera, MapPin, HeartPulse } from 'lucide-react';

const studentSchema = z.object({
  firstName: z.string().min(2, 'First name is mandatory.'),
  lastName: z.string().min(2, 'Last name is mandatory.'),
  gender: z.string().min(1, 'Please select gender.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  divisionId: z.string().min(1, 'Please assign an academic division.'),
  rollNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  allergies: z.string().optional(),
  photoUrl: z.string().optional(),
  parentFirstName: z.string().min(2, 'Guardian first name required.'),
  parentLastName: z.string().min(2, 'Guardian last name required.'),
  parentPhone: z.string().length(10, 'Guardian mobile must be 10 digits for sibling linkage.'),
  parentEmail: z.string().email('Please input valid guardian email address.').optional().or(z.literal('')),
  relationship: z.string().default('Father'),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  initialData?: any | null;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [divisions, setDivisions] = useState<any[]>([]);
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

  useEffect(() => {
    if (!initialData && isOpen && formData.firstName) {
      localStorage.setItem('sdjm_student_draft', JSON.stringify(formData));
      setDraftSaved(true);
      const timer = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, initialData, isOpen]);

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const res = await api.get('/settings');
        const list: any[] = [];
        res.data.data.standards?.forEach((s: any) => {
          s.divisions?.forEach((d: any) => list.push({ id: d.id || `${s.id}_${d.name}`, label: `${s.name} - Division ${d.name} (${d.roomNumber || 'Room 101'})` }));
        });
        setDivisions(list.length ? list : [
          { id: 'div_09a', label: 'Standard 09 — Division A (Room 201)' },
          { id: 'div_10a', label: 'Standard 10 — Division A (Room 101)' },
          { id: 'div_11a', label: 'Standard 11 Commerce — Division A (Room 301)' },
          { id: 'div_12a', label: 'Standard 12 Commerce — Division A (Room 302)' },
        ]);
      } catch (e) {
        setDivisions([
          { id: 'div_09a', label: 'Standard 09 — Division A (Room 201)' },
          { id: 'div_10a', label: 'Standard 10 — Division A (Room 101)' },
          { id: 'div_11a', label: 'Standard 11 Commerce — Division A (Room 301)' },
          { id: 'div_12a', label: 'Standard 12 Commerce — Division A (Room 302)' },
        ]);
      }
    };
    fetchDivisions();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const p = initialData.parents?.[0]?.parent;
        const pName = p?.fatherName || p?.motherName || p?.guardianName || '';
        const nameParts = pName.split(' ');
        
        setPhotoPreview(initialData.photoUrl || null);
        setPhotoFile(null);

        reset({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          gender: initialData.gender || 'Male',
          dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
          divisionId: initialData.divisionId || '',
          rollNumber: initialData.rollNumber || '',
          bloodGroup: initialData.bloodGroup || '',
          address: initialData.address || p?.address || '',
          emergencyContact: initialData.emergencyContact || '',
          allergies: initialData.allergies || '',
          photoUrl: initialData.photoUrl || '',
          parentFirstName: nameParts[0] || p?.firstName || '',
          parentLastName: nameParts.slice(1).join(' ') || p?.lastName || '',
          parentPhone: p?.phone || p?.user?.phone || '',
          parentEmail: p?.email || p?.user?.email || '',
          relationship: initialData.parents?.[0]?.relationship || p?.relationship || 'Father',
        });
      } else {
        setPhotoPreview(null);
        setPhotoFile(null);
        reset({
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
    try {
      let response;
      if (photoFile) {
        // Multipart submission
        const formDataPayload = new FormData();
        Object.entries(data).forEach(([key, val]) => {
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
        // Standard JSON submission
        if (initialData?.id) {
          response = await api.put(`/students/${initialData.id}`, data);
        } else {
          response = await api.post('/students', data);
        }
      }

      localStorage.removeItem('sdjm_student_draft');
      onSuccess(response.data.data || data);
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to enroll student. Please verify institutional details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Update Pupil Record: ${initialData.grNumber}` : 'Student Admission & General Register Onboarding'}
      subtitle="Manage full student profile, biological metrics, photograph asset, and guardian connections."
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
            <span>⚠️ {serverError}</span>
            <button type="button" onClick={() => setServerError(null)} className="text-rose-600 font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {draftSaved && (
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <span>💾 Draft enrollment application auto-saved locally.</span>
            <Check className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Section 1: Photo & Pupil Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary-600" /> Pupil Identity, Biological & Asset Details
          </h4>

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
              <p className="text-[11px] text-slate-500">Upload a official passport-style photograph (JPEG/PNG/WebP, max 5MB). Photo will be stored securely in Cloudinary.</p>
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
              <input type="text" {...register('firstName')} placeholder="e.g. Parthiv" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
              {errors.firstName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Last Name *</label>
              <input type="text" {...register('lastName')} placeholder="e.g. Mehta" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
              {errors.lastName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Gender *</label>
              <select {...register('gender')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Date of Birth *</label>
              <input type="date" {...register('dob')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Blood Group</label>
              <select {...register('bloodGroup')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500">
                <option value="">-- Not Provided --</option>
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Assigned Division *</label>
              <select {...register('divisionId')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500">
                <option value="">-- Select Division --</option>
                {divisions.map((div: any) => (
                  <option key={div.id} value={div.id}>{div.label}</option>
                ))}
              </select>
              {errors.divisionId && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.divisionId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Roll Number</label>
              <input type="text" {...register('rollNumber')} placeholder="e.g. 01" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Emergency Contact Phone</label>
              <input type="text" maxLength={10} {...register('emergencyContact')} placeholder="9825099999" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Medical Allergies / Conditions</label>
              <input type="text" {...register('allergies')} placeholder="e.g. Asthma, Penicillin" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary-600" /> Residential Address
            </label>
            <textarea {...register('address')} rows={2} placeholder="House No / Street, Area, City, District, State, Pincode (e.g. Krishnanagar, Bhavnagar, Gujarat)" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"></textarea>
          </div>
        </div>

        {/* Section 2: Guardian & Sibling Mapping */}
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-600" /> Guardian Credentials & Sibling Linkage</span>
            <span className="text-[10px] text-primary-600 font-extrabold uppercase">PRD Chapter 4 & 9 Protocol</span>
          </h4>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
            💡 <strong>Smart Sibling Linkage:</strong> If the Guardian Mobile contact entered below matches an active Parent account, this new pupil will automatically be linked in the Parent Portal's <strong>Sibling Switcher</strong>!
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Guardian First Name *</label>
              <input type="text" {...register('parentFirstName')} placeholder="e.g. Arvindbhai" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
              {errors.parentFirstName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.parentFirstName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Guardian Last Name *</label>
              <input type="text" {...register('parentLastName')} placeholder="e.g. Mehta" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
              {errors.parentLastName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.parentLastName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Relationship *</label>
              <select {...register('relationship')} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary-500">
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Guardian Mobile (10 Digits) *</label>
              <input type="text" maxLength={10} {...register('parentPhone')} placeholder="9825012345" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500" />
              {errors.parentPhone && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.parentPhone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Guardian Email (Optional Portal ID)</label>
              <input type="email" {...register('parentEmail')} placeholder="arvind.mehta@gmail.com" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
              {errors.parentEmail && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.parentEmail.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => { localStorage.removeItem('sdjm_student_draft'); reset(); onClose(); }} className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs">Cancel</button>
          <button
            type="submit"
            disabled={submitting || uploadingPhoto}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition flex items-center gap-2"
          >
            {submitting ? 'Saving Pupil Record...' : (initialData ? 'Save Changes' : 'Confirm Admission & Dispatch Credentials')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentFormModal;
