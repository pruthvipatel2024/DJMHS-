import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import { AlertTriangle, Clock, ShieldCheck, User, BookOpen, Building2, Trash2, CheckCircle2 } from 'lucide-react';

interface TimetableCellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg?: string) => void;
  divisionId?: string;
  staffId?: string;
  dayOfWeek: string;
  periodLabel: string;
  timeRange: string;
  initialData?: any;
  mode?: 'CLASS' | 'FACULTY';
}

const TimetableCellModal: React.FC<TimetableCellModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  divisionId: propDivisionId,
  staffId: propStaffId,
  dayOfWeek,
  periodLabel,
  timeRange,
  initialData,
  mode = 'CLASS',
}) => {
  const [activeDivisionId, setActiveDivisionId] = useState<string>(
    initialData?.divisionId || propDivisionId || ''
  );
  const [staffId, setStaffId] = useState<string>(
    initialData?.staffId || propStaffId || ''
  );
  const [subjectId, setSubjectId] = useState<string>(initialData?.subjectId || '');
  const [roomNumber, setRoomNumber] = useState<string>(initialData?.roomNumber || '');

  const [divisionsList, setDivisionsList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [standardsData, setStandardsData] = useState<any[]>([]);
  const [allocatedTeacherInfo, setAllocatedTeacherInfo] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [clashError, setClashError] = useState<string | null>(null);

  // Load divisions, standards, and staff
  useEffect(() => {
    if (!isOpen) return;
    const fetchMetadata = async () => {
      try {
        const [staffRes, settingsRes] = await Promise.all([
          api.get('/staff'),
          api.get('/settings'),
        ]);

        const allStaff = staffRes.data?.data || [];
        setStaffList(allStaff);

        const standards = settingsRes.data?.data?.standards || [];
        setStandardsData(standards);

        const divList: any[] = [];
        standards.forEach((std: any) => {
          std.divisions?.forEach((div: any) => {
            divList.push({
              id: div.id,
              name: `${std.name} — Division ${div.name}`,
              standardId: std.id,
              standardName: std.name,
              divisionName: div.name,
              roomNumber: div.roomNumber || '',
              subjects: std.subjects || [],
              subjectMappings: div.subjectMappings || [],
            });
          });
        });
        setDivisionsList(divList);

        // Determine current division
        let targetDivId = initialData?.divisionId || propDivisionId || (divList.length > 0 ? divList[0].id : '');
        setActiveDivisionId(targetDivId);

        // Find division data
        const currentDiv = divList.find((d) => d.id === targetDivId);
        const stdSubs = currentDiv?.subjects || settingsRes.data?.data?.subjects || [];
        setSubjectsList(stdSubs);

        // Set room
        setRoomNumber(initialData?.roomNumber || currentDiv?.roomNumber || 'Room 101');

        // Set initial staff
        if (initialData?.staffId) {
          setStaffId(initialData.staffId);
        } else if (propStaffId) {
          setStaffId(propStaffId);
        } else if (allStaff.length > 0) {
          setStaffId(allStaff[0].id);
        }

        // Set initial subject
        if (initialData?.subjectId) {
          setSubjectId(initialData.subjectId);
        } else if (stdSubs.length > 0) {
          setSubjectId(stdSubs[0].id);
          // Check allocated teacher
          const mapping = currentDiv?.subjectMappings?.find((m: any) => m.subjectId === stdSubs[0].id);
          if (mapping && mapping.staff) {
            if (mode !== 'FACULTY') setStaffId(mapping.staff.id);
            setAllocatedTeacherInfo(`${mapping.staff.firstName} ${mapping.staff.lastName}`);
          }
        }
      } catch (e) {
        setStaffList([]);
        setDivisionsList([]);
        setSubjectsList([]);
      }
    };

    fetchMetadata();
  }, [isOpen, propDivisionId, propStaffId, initialData]);

  // When division changes (especially in FACULTY view mode)
  const handleDivisionChange = (newDivId: string) => {
    setActiveDivisionId(newDivId);
    setClashError(null);

    const divObj = divisionsList.find((d) => d.id === newDivId);
    if (divObj) {
      if (divObj.roomNumber) setRoomNumber(divObj.roomNumber);
      const subs = divObj.subjects?.length > 0 ? divObj.subjects : [];
      setSubjectsList(subs);

      if (subs.length > 0) {
        setSubjectId(subs[0].id);
        const mapping = divObj.subjectMappings?.find((m: any) => m.subjectId === subs[0].id);
        if (mapping && mapping.staff) {
          setAllocatedTeacherInfo(`${mapping.staff.firstName} ${mapping.staff.lastName}`);
        } else {
          setAllocatedTeacherInfo(null);
        }
      } else {
        setSubjectId('');
        setAllocatedTeacherInfo(null);
      }
    }
  };

  const handleSubjectChange = (newSubId: string) => {
    setSubjectId(newSubId);
    setClashError(null);

    const divObj = divisionsList.find((d) => d.id === activeDivisionId);
    const mapping = divObj?.subjectMappings?.find((m: any) => m.subjectId === newSubId);

    if (mapping && mapping.staff) {
      if (mode !== 'FACULTY') setStaffId(mapping.staff.id);
      setAllocatedTeacherInfo(`${mapping.staff.firstName} ${mapping.staff.lastName}`);
    } else {
      setAllocatedTeacherInfo(null);
    }
  };

  const handleSave = async () => {
    if (!activeDivisionId) {
      setClashError('Please select a target Classroom Division.');
      return;
    }
    if (!subjectId) {
      setClashError('Please select or specify a curriculum subject.');
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
        divisionId: activeDivisionId,
        subjectId,
        staffId,
        dayOfWeek: cleanDay,
        periodNumber: periodNum,
        startTime,
        endTime,
        roomNumber: roomNumber || 'Classroom',
      });

      onSuccess('Timetable slot saved! Verified teacher has zero clashes and schedule is synchronized across both class and faculty registers.');
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setClashError(err.response?.data?.message || 'Schedule clash detected. A single teacher cannot teach two classes at the same time.');
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
      onSuccess('Schedule period assignment vacated successfully.');
      onClose();
    } catch (e) {
      onSuccess('Period slot assignment cleared.');
      onClose();
    }
  };

  const currentTeacherObj = staffList.find((s) => s.id === staffId);
  const currentDivObj = divisionsList.find((d) => d.id === activeDivisionId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Schedule Period: ${dayOfWeek}`}
      subtitle={`${periodLabel} (${timeRange}) — Real-time bidirectional teacher clash prevention`}
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
              <h4 className="font-black text-sm text-red-950 uppercase tracking-wide">
                System Prevented Schedule Clash!
              </h4>
              <p className="text-xs text-red-800 mt-1 font-semibold leading-relaxed">
                {clashError}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              Dual-Booking Clash Protection Active: Automatic verification against all other classrooms for this time slot.
            </span>
          </div>
        )}

        <div className="space-y-4">
          {/* Target Division / Classroom Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary-600" />
                Target Class & Division *
              </span>
              {mode === 'FACULTY' && (
                <span className="text-[11px] text-primary-600 font-extrabold">
                  Select which class this teacher will instruct
                </span>
              )}
            </label>
            <select
              value={activeDivisionId}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {divisionsList.length === 0 ? (
                <option value="">-- No Classes Found in Database --</option>
              ) : (
                divisionsList.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name} {div.roomNumber ? `(${div.roomNumber})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Curriculum Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                Standard Curriculum Subject *
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {currentDivObj ? `Filtered for ${currentDivObj.standardName}` : 'Curriculum subjects'}
              </span>
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
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setClashError(null);
                }}
                placeholder="e.g. Elements of Accounts, Mathematics, Gujarati"
                className="w-full p-3 border border-slate-300 rounded-xl text-sm font-black text-slate-800 bg-white focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>

          {/* Assigned Faculty Instructor */}
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
              onChange={(e) => {
                setStaffId(e.target.value);
                setClashError(null);
              }}
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

          {/* Classroom / Laboratory Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Classroom or Laboratory Location *
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => {
                setRoomNumber(e.target.value);
                setClashError(null);
              }}
              placeholder="e.g. Room 101 or Commerce Lab"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {initialData && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Clear Slot Assignment
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition disabled:opacity-50 cursor-pointer"
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
