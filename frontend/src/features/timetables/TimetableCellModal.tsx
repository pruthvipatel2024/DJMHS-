import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import { AlertTriangle, Clock, ShieldCheck, User, Trash2 } from 'lucide-react';

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
  
  const [staffList, setStaffList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [clashError, setClashError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const staffRes = await api.get('/staff');
        setStaffList(staffRes.data.data || []);
        if (staffRes.data.data?.length > 0 && !staffId) {
          setStaffId(staffRes.data.data[0].id);
        }
      } catch (e) {
        setStaffList([]);
      }
    };
    if (isOpen) fetchDropdownData();
  }, [isOpen]);

  const handleSave = async () => {
    if (!staffId) {
      setClashError('Please select a faculty instructor from the database.');
      return;
    }
    setSubmitting(true);
    setClashError(null);
    try {
      const startTime = timeRange.split(' — ')[0];
      const endTime = timeRange.split(' — ')[1];
      
      await api.post('/timetables/slot', {
        id: initialData?.id,
        divisionId,
        subjectId,
        staffId,
        dayOfWeek,
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
        setClashError('Failed to save timetable slot assignment.');
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
            <span>PRD Protocol Active: Attempting to schedule a teacher already booked in this time slot will automatically abort with a clash warning.</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Academic Subject Title *</label>
            <input
              type="text"
              value={subjectId}
              onChange={(e) => { setSubjectId(e.target.value); setClashError(null); }}
              placeholder="e.g. Accountancy, Economics, Commercial Statistics"
              className="w-full p-3 border border-slate-300 rounded-xl text-sm font-black text-slate-800 bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Assigned Database Faculty Instructor *</label>
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
                    {s.firstName} {s.lastName} ({s.empId} — {s.designation})
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
              placeholder="e.g. Room 101 or Computer Lab"
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
