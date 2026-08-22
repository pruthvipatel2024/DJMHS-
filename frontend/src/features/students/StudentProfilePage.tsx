import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GraduationCap, Users, CalendarCheck, Coins, ArrowLeft, Phone, Mail, Award, Clock } from 'lucide-react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { formatDate } from '../../utils/date.utils';
import { getFullPhotoUrl } from '../../utils/photo.utils';

const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'parents' | 'history' | 'fees'>('personal');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/students/${id}`);
        setStudent(res.data.data);
        setImageError(false);
      } catch (e) {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={5} />;

  const historyList = student?.promotions || student?.academicHistory || [];
  const parentList = student?.parents || [];
  const feeList = student?.feeInstallments || [];
  const attendanceList = student?.attendance || [];
  const residentialAddress = student?.address || parentList?.[0]?.parent?.address;

  const totalMarkedDays = attendanceList.length;
  const presentDays = attendanceList.filter((a: any) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
  const attendancePercentage = totalMarkedDays > 0 ? Math.round((presentDays / totalMarkedDays) * 100) : 0;
  const photoPath = getFullPhotoUrl(student?.photoUrl);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      <button
        onClick={() => navigate('/admin/students')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Return to General Student Roster
      </button>

      {/* Pupil Header Card */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-primary-600">
        <div className="flex items-center gap-6">
          {photoPath && !imageError ? (
            <img
              src={photoPath}
              alt={`${student.firstName} ${student.lastName}`}
              onError={() => setImageError(true)}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-accent-400 shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-accent-400 to-accent-600 text-slate-900 font-extrabold text-3xl flex items-center justify-center shadow-lg flex-shrink-0">
              {student?.firstName?.[0] || 'P'}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-primary-600 text-accent-300 text-xs font-extrabold uppercase font-mono">
                GR: {student?.grNumber || 'N/A'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-bold text-xs">
                Roll No: {student?.rollNumber || 'N/A'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-white">{student?.firstName} {student?.lastName}</h2>
            <p className="text-sm text-primary-200 font-medium">
              {student?.division ? `${student.division.standard?.name || 'Standard'} — Division ${student.division.name}${student.division.roomNumber ? ` (${student.division.roomNumber})` : ''}` : 'Unassigned Class'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto text-xs">
          <button onClick={() => setActiveTab('fees')} className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold transition shadow-lg flex items-center justify-center gap-2">
            <Coins className="w-4 h-4 text-slate-900" /> Review Fee Ledger
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab('personal')} className={`px-6 py-3 font-extrabold text-xs border-b-2 transition -mb-px ${activeTab === 'personal' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Pupil Personal & Biological Data
        </button>
        <button onClick={() => setActiveTab('parents')} className={`px-6 py-3 font-extrabold text-xs border-b-2 transition -mb-px ${activeTab === 'parents' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Guardian & Sibling Connections ({parentList.length})
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-extrabold text-xs border-b-2 transition -mb-px ${activeTab === 'history' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Academic Promotion History ({historyList.length})
        </button>
        <button onClick={() => setActiveTab('fees')} className={`px-6 py-3 font-extrabold text-xs border-b-2 transition -mb-px ${activeTab === 'fees' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Fee Accounts & Receipts
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Gender</span>
                <span className="font-extrabold text-slate-800 text-sm">{student?.gender || 'Not Specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Date of Birth (DD/MM/YYYY)</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  {student?.dob ? formatDate(student.dob) : <span className="text-slate-400 italic">Not Provided</span>}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Blood Group</span>
                {student?.bloodGroup ? (
                  <span className="px-3 py-1 rounded-lg bg-red-50 text-red-700 font-extrabold text-xs inline-block border border-red-200">
                    {student.bloodGroup}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Not Provided</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block mb-1">Residential Address</span>
              {residentialAddress ? (
                <p className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-700 leading-relaxed text-sm">
                  {residentialAddress}
                </p>
              ) : (
                <p className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-400 italic text-sm">
                  No residential address recorded
                </p>
              )}
            </div>

            {/* Dynamic Attendance Performance Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between col-span-1 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-800 text-sm">Attendance Compliance</h5>
                  <p className="text-xs text-slate-500">
                    {totalMarkedDays > 0 ? `${presentDays} days present out of ${totalMarkedDays} recorded sessions` : 'No attendance sessions recorded yet'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600">{attendancePercentage}%</span>
                <span className="block text-[10px] font-bold uppercase text-slate-400">PostgreSQL Metric</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parents' && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600" /> Registered Guardians (Parent Portal Enabled)
            </h4>
            {parentList.length > 0 ? (
              <div className="space-y-3">
                {parentList.map((rel: any, idx: number) => {
                  const p = rel.parent;
                  const parentName = p?.fatherName || p?.motherName || p?.guardianName || [p?.firstName, p?.lastName].filter(Boolean).join(' ') || 'Guardian';
                  return (
                    <div key={idx} className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded bg-primary-100 text-primary-800 text-[10px] font-black uppercase tracking-wide">
                          {rel.relationship || p?.relationship || 'Guardian'} {rel.isPrimary ? '(Primary Contact)' : ''}
                        </span>
                        <h5 className="font-black text-slate-900 text-base mt-1">{parentName}</h5>
                        {p?.address && <p className="text-xs text-slate-500 mt-1">Address: {p.address}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        {p?.phone && <div className="flex items-center gap-1.5 text-slate-700 font-mono font-bold"><Phone className="w-4 h-4 text-primary-600" /> {p.phone}</div>}
                        {p?.email && <div className="flex items-center gap-1.5 text-slate-700 font-medium"><Mail className="w-4 h-4 text-primary-600" /> {p.email}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Linked Guardians</p>
                <p className="text-xs text-slate-400">No parent or guardian connections recorded for this student profile.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Longitudinal Grade Promotion Timeline
            </h4>
            {historyList.length > 0 ? (
              <div className="space-y-3 border-l-2 border-primary-500 pl-4 ml-2">
                {historyList.map((h: any, i: number) => {
                  const stdName = h.toDivision?.standard?.name || h.fromDivision?.standard?.name || h.standard?.name || 'Standard';
                  const divName = h.toDivision?.name || h.fromDivision?.name || h.divisionName || 'A';
                  const yrName = h.academicYear?.name || h.academicYearId || 'N/A';
                  return (
                    <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center relative">
                      <span className="w-3 h-3 rounded-full bg-primary-600 absolute -left-[23px] top-5 border-2 border-white"></span>
                      <div>
                        <h5 className="font-black text-slate-800 text-sm">{stdName} (Division {divName})</h5>
                        <p className="text-xs text-slate-400 mt-0.5">Session: {yrName} | Date: {new Date(h.createdAt).toLocaleDateString()}</p>
                        {h.remarks && <p className="text-xs text-slate-500 italic mt-0.5">{h.remarks}</p>}
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-lg uppercase">
                        {h.promotionStatus || h.finalStatus || 'PROMOTED'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                <Award className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Promotion History Recorded</p>
                <p className="text-xs text-slate-400">This pupil has not undergone academic year promotions yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600" /> Fee Installment Ledger
            </h4>
            {feeList.length > 0 ? (
              <div className="space-y-3">
                {feeList.map((f: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                      <h5 className="font-extrabold text-slate-800 text-sm">{f.title}</h5>
                      <p className="text-xs text-slate-400">Due Date: {new Date(f.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <span className="text-base font-black text-slate-900">₹{f.amount.toLocaleString()}</span>
                      <span className={`px-3 py-1 rounded-lg font-extrabold text-xs ${f.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                <Coins className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Fee Installments Found</p>
                <p className="text-xs text-slate-400">No active fee ledger or receipts recorded for this student.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentProfilePage;
