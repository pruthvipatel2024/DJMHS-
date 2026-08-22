import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, BookOpen, CalendarCheck, ArrowLeft, Mail, Phone, MapPin, Award } from 'lucide-react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { formatDate } from '../../utils/date.utils';
import { getFullPhotoUrl } from '../../utils/photo.utils';

const StaffProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'teaching' | 'qualifications'>('info');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get(`/staff/${id}`);
        setStaff(res.data.data);
        setImageError(false);
      } catch (e) {
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={5} />;

  const photoPath = getFullPhotoUrl(staff?.photoUrl);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      <button
        onClick={() => navigate('/admin/staff')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Staff Directory
      </button>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-primary-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-primary-600/50">
        <div className="flex items-center gap-6">
          {photoPath && !imageError ? (
            <img
              src={photoPath}
              alt={`${staff.firstName} ${staff.lastName}`}
              onError={() => setImageError(true)}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-accent-400 shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-accent-400 to-accent-600 text-slate-900 font-extrabold text-3xl flex items-center justify-center shadow-lg flex-shrink-0">
              {staff?.firstName?.[0] || 'T'}
            </div>
          )}
          <div className="space-y-1">
            <span className="px-3 py-0.5 rounded-full bg-primary-600 text-accent-300 text-[11px] font-extrabold uppercase">
              {staff?.empId || 'DJMHS-EMP-0001'} | {staff?.department?.name || 'Faculty'}
            </span>
            <h2 className="text-3xl font-black text-white">{staff?.firstName} {staff?.lastName}</h2>
            <p className="text-sm text-slate-300 font-medium">{staff?.designation} — Shree Dhaneshkumar Jasvantlal Maheta High School</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto text-xs">
          <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2">
            <Phone className="w-4 h-4 text-accent-400" /> <span className="font-mono font-bold">{staff?.phone}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 truncate max-w-xs">
            <Mail className="w-4 h-4 text-accent-400" /> <span className="font-medium truncate">{staff?.email}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-6 py-3 font-extrabold text-xs border-b-2 transition -mb-px ${activeTab === 'info' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Personal & Employment Info
        </button>
        <button
          onClick={() => setActiveTab('teaching')}
          className={`px-6 py-3 font-extrabold text-xs border-b-2 transition -mb-px ${activeTab === 'teaching' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Teaching & Homeroom Schedule ({staff?.subjectTeachings?.length || 1})
        </button>
        <button
          onClick={() => setActiveTab('qualifications')}
          className={`px-6 py-3 font-extrabold text-xs border-b-2 transition -mb-px ${activeTab === 'qualifications' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Academic Qualifications ({staff?.qualifications?.length || 0})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div><span className="text-slate-400 font-bold uppercase block mb-1">Gender</span><span className="font-extrabold text-slate-800 text-sm">{staff?.gender || 'Not Specified'}</span></div>
              <div><span className="text-slate-400 font-bold uppercase block mb-1">Date of Birth (DD/MM/YYYY)</span><span className="font-extrabold text-slate-800 text-sm">{staff?.dob ? formatDate(staff.dob) : 'Not Specified'}</span></div>
              <div><span className="text-slate-400 font-bold uppercase block mb-1">Date of Joining (DD/MM/YYYY)</span><span className="font-extrabold text-slate-800 text-sm">{staff?.joinDate ? formatDate(staff.joinDate) : 'Not Specified'}</span></div>
              <div><span className="text-slate-400 font-bold uppercase block mb-1">Institutional Status</span><span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs inline-block">Active Roster</span></div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Residential Address</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-700 leading-relaxed flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  {staff?.address || 'No residential address on record'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teaching' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-600" /> Class Teacher Homeroom Assignment
              </h4>
              {staff?.classTeacherOf?.map((c: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-primary-50/50 border border-primary-200 text-xs flex justify-between items-center font-bold">
                  <span>{c.division?.standard?.name || 'Standard 10'} — Division {c.division?.name || 'A'}</span>
                  <span className="text-primary-700">{c.division?.roomNumber || 'Room 101'}</span>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-600" /> Subject Teaching Responsibilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {staff?.subjectTeachings?.map((st: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-extrabold text-slate-800">{st.subject?.name || 'Mathematics'}</div>
                      <div className="text-[10px] text-slate-400">{st.subject?.code || 'MATH-10'}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-white font-extrabold text-primary-700 border border-slate-200">
                      Std {st.division?.name || '10-A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qualifications' && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Verified Degrees & Certificates
            </h4>
            <div className="space-y-3">
              {staff?.qualifications?.map((q: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-sm">{q.degree}</h5>
                    <p className="text-xs text-slate-500">{q.institution}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-lg">
                    Class of {q.year}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default StaffProfilePage;
