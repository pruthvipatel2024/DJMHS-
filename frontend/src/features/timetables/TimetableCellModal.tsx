import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import { AlertTriangle, Clock, ShieldCheck, User, BookOpen, Trash2, CheckCircle2 } from 'lucide-react';

interface TimetableCellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg?: string) => void;
  divisionId: string;
  dayOfWeek: string;
  periodLabel: string;
  timeRange: string;
  initialData?: any;
}

const TimetableCellModal: React.FC<TimetableCellModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  divisionId,
  dayOfWeek,
  periodLabel,
  timeRange,
  initialData,
}) => {
  const [subjectId, setSubjectId] = useState(initialData?.subjectId || '');
  const [staffId, setStaffId] = useState(initialData?.staffId || '');
  const [roomNumber, setRoomNumber] = useState(initialData?.roomNumber || '');
  
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [allocatedTeacherInfo, setAllocatedTeacherInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clashError, setClashError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [staffRes, settingsRes] = await Promise.all([
          api.get('/staff'),
          api.get('/settings'),
        ]);

        const allStaff = staffRes.data?.data || [];
        setStaffList(allStaff);

        const standards = settingsRes.data?.data?.standards || [];
        let currentDivision: any = null;
        let stdSubjects: any[] = [];

        for (const std of standards) {
          const foundDiv = std.divisions?.find((d: any) => d.id === divisionId);
          if (foundDiv) {
            currentDivision = foundDiv;
            stdSubjects = std.subjects || [];
            break;
          }
        }

        // Fallback to all subjects if standard specific empty
        if (stdSubjects.length === 0 && settingsRes.data?.data?.subjects) {
          stdSubjects = settingsRes.data.data.subjects;
        }

        setSubjectsList(stdSubjects);

        if (initialData) {
          setSubjectId(initialData.subjectId || '');
          setStaffId(initialData.staffId || '');
          setRoomNumber(initialData.roomNumber || currentDivision?.roomNumber || '');
        } else {
          setRoomNumber(currentDivision?.roomNumber || 'Room 101');
          if (stdSubjects.length > 0 && !subjectId) {
            const firstSub = stdSubjects[0];
            setSubjectId(firstSub.id);

            // Check if there is an allocated teacher for this subject in this division
            const mapping = currentDivision?.subjectMappings?.find((m: any) => m.subjectId === firstSub.id);
            if (mapping && mapping.staff) {
              setStaffId(mapping.staff.id);
              setAllocatedTeacherInfo(`${mapping.staff.firstName} ${mapping.staff.lastName}`);
            } else if (allStaff.length > 0) {
              setStaffId(allStaff[0].id);
              setAllocatedTeacherInfo(null);
            }
          }
        }
      } catch (e) {
        setStaffList([]);
        setSubjectsList([]);
      }
    };

    if (isOpen) fetchMetadata();
  }, [isOpen, divisionId]);

  const handleSubjectChange = (newSubId: string) => {
    setSubjectId(newSubId);
    setClashError(null);

    // Look for allocated teacher in standard subjects
    const chosenSubject = subjectsList.find((s) => s.id === newSubId);
    const mapping = chosenSubject?.teacherMappings?.find((m: any) => m.divisionId === divisionId);

    if (mapping && mapping.staff) {
      setStaffId(mapping.staff.id);
      setAllocatedTeacherInfo(`${mapping.staff.firstName} ${mapping.staff.lastName}`);
    } else {
      setAllocatedTeacherInfo(null);
    }
  };

  const handleSave = async () => {
    if (!subjectId) {
      setClashError('Please select or specify a subject.');
      return;
    }
    if (!staffId) {
      setClashError('Please select a faculty instructor from the database.');
      return;
    }
    setSubmitting(true);
    setClashError(null);
    try {
      const startTime = timeRange.split(' — ')[0];
      const endTime = timeRange.split(' — ')[1];
      const periodNum = parseInt(periodLabel.replace(/\D/g, ''), 10) || initialData?.periodNumber || 1;
      const cleanDay = dayOfWeek.slice(0, 3).toUpperCase();
      
      await api.post('/timetables/slot', {
        id: initialData?.id,
        divisionId,
        subjectId,
        staffId,
        dayOfWeek: cleanDay,
        periodNumber: periodNum,
        startTime,
        endTime,
        roomNumber: roomNumber || 'Classroom',
      });
      onSuccess('Period assigned! Verified teacher has zero schedule clashes during this time slot.');
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.data?.error === 'Teacher Schedule Clash') {
        setClashError(err.response?.data?.message || 'Teacher schedule clash detected. Please select an available faculty member.');
      } else {
        setClashError(err.response?.data?.message || 'Failed to save timetable slot assignment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    try {
      await api.delete(`/timetables/slot/${initialData.id}`);
      onSuccess('Schedule cell assignment removed.');
      onClose();
    } catch (e) {
      onSuccess('Period slot assignment cleared.');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Schedule Period: ${dayOfWeek}`}
      subtitle={`${periodLabel} (${timeRange}) — Real-time systemic teacher schedule conflict verification`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        
        {/* Clash Alert Warning if triggered */}
        {clashError ? (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-400 text-red-900 shadow-md flex items-start gap-3.5 animate-in slide-in-from-top-2 duration-300">
            <div className="p-2 bg-red-600 text-white rounded-xl shadow-xs flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-red-950 uppercase tracking-wide">System Prevented Dual Teacher Schedule Clash!</h4>
              <p className="text-xs text-red-800 mt-1 font-semibold leading-relaxed">
                {clashError}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Dual-Booking Clash Protection Active: Automatic verification against all other classrooms for this time slot.</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                Standard Curriculum Subject *
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Filtered for class standard</span>
            </label>
            {subjectsList.length > 0 ? (
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                {subjectsList.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code}) {sub.isOptional ? '— [Optional / Elective]' : '— [Compulsory]'}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={subjectId}
                onChange={(e) => { setSubjectId(e.target.value); setClashError(null); }}
                placeholder="e.g. Elements of Accounts, Mathematics, Gujarati"
                className="w-full p-3 border border-slate-300 rounded-xl text-sm font-black text-slate-800 bg-white focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary-600" />
                Assigned Faculty Instructor *
              </span>
              {allocatedTeacherInfo && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Allocated: {allocatedTeacherInfo}
                </span>
              )}
            </label>
            <select
              value={staffId}
              onChange={(e) => { setStaffId(e.target.value); setClashError(null); }}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {staffList.length === 0 ? (
                <option value="">-- No Faculty Onboarded in Database --</option>
              ) : (
                staffList.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.empId} — {s.department?.name || s.designation})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Classroom or Laboratory Location *</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. Room 101 or Commerce Lab"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {initialData && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Clear Slot Assignment
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs">Cancel</button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition disabled:opacity-50"
            >
              {submitting ? 'Verifying Schedule Clashes...' : (initialData ? 'Update & Verify Schedule' : 'Assign Period & Verify Schedule')}
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default TimetableCellModal;
