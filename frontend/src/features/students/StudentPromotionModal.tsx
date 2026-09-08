import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import { ArrowUpRight, CheckSquare, Square, AlertCircle, Loader2, ArrowRight, Building2, Users } from 'lucide-react';
import StorageService from '../../utils/storage.utils';
import useUnsavedWarning from '../../utils/useUnsavedWarning';

interface StudentPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  students: any[];
  initialStandardId?: string;
  initialDivisionId?: string;
}

const StudentPromotionModal: React.FC<StudentPromotionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  students,
  initialStandardId,
  initialDivisionId,
}) => {
  const [standards, setStandards] = useState<any[]>([]);
  const [sourceDivisionId, setSourceDivisionId] = useState<string>('');
  const [targetDivisionId, setTargetDivisionId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useUnsavedWarning(isOpen && selectedIds.length > 0, 'You have uncommitted cohort promotion selections. Are you sure you want to refresh?');

  // Fetch standards & divisions
  useEffect(() => {
    const fetchDivisions = async () => {
      setLoadingDivisions(true);
      setErrorMsg(null);
      try {
        const res = await api.get('/settings');
        const fetchedStandards = res.data?.data?.standards || [];
        setStandards(fetchedStandards);

        // Find available divisions
        const allDivs: any[] = [];
        fetchedStandards.forEach((s: any) => {
          s.divisions?.forEach((d: any) => allDivs.push({ ...d, standardName: s.name, standardLevel: s.level }));
        });

        // Set default source division
        let defaultSource = initialDivisionId || '';
        if (!defaultSource && initialStandardId) {
          const matchStd = fetchedStandards.find((s: any) => s.id === initialStandardId);
          if (matchStd?.divisions?.[0]?.id) {
            defaultSource = matchStd.divisions[0].id;
          }
        }
        if (!defaultSource && allDivs.length > 0) {
          defaultSource = allDivs[0].id;
        }
        setSourceDivisionId(defaultSource);

        // Set default target division
        if (allDivs.length > 1) {
          const srcIdx = allDivs.findIndex((d) => d.id === defaultSource);
          const nextDiv = allDivs[srcIdx + 1] || allDivs[0];
          setTargetDivisionId(nextDiv.id);
        } else if (allDivs.length === 1) {
          setTargetDivisionId('GRADUATED');
        }
      } catch (err: any) {
        console.error('Failed to load standards/divisions:', err);
        setErrorMsg('Failed to load standards from server. Please refresh.');
      } finally {
        setLoadingDivisions(false);
      }
    };

    if (isOpen) {
      fetchDivisions();
    }
  }, [isOpen, initialStandardId, initialDivisionId]);

  // Filter students by selected Source Division
  const filteredStudents = useMemo(() => {
    if (!sourceDivisionId || sourceDivisionId === 'all') return students;
    return students.filter((s) => s.divisionId === sourceDivisionId || s.division?.id === sourceDivisionId);
  }, [students, sourceDivisionId]);

  // When source division changes, select all students in that class cohort
  useEffect(() => {
    if (filteredStudents.length > 0) {
      setSelectedIds(filteredStudents.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  }, [filteredStudents]);

  const toggleAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Find source & target division details for clean visual display
  const getDivLabel = (divId: string) => {
    if (!divId) return 'Not Selected';
    if (divId === 'GRADUATED') return 'Graduated / Alumni Archive (Std 12 Completed)';
    for (const std of standards) {
      const d = std.divisions?.find((div: any) => div.id === divId);
      if (d) return `${std.name} — Div ${d.name} (${d.roomNumber || 'Room N/A'})`;
    }
    return divId;
  };

  const handlePromote = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Please select at least one student from the class cohort for promotion.');
      return;
    }
    if (!targetDivisionId) {
      setErrorMsg('Please select a target destination division.');
      return;
    }
    if (sourceDivisionId === targetDivisionId) {
      setErrorMsg('Destination division cannot be the same as the source division.');
      return;
    }

    setPromoting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/students/promote', {
        studentIds: selectedIds,
        targetDivisionId: targetDivisionId,
      });

      const count = res.data?.data?.promotedCount ?? selectedIds.length;
      onSuccess(count);
      onClose();
    } catch (err: any) {
      console.error('Promotion failed:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Academic promotion failed. Please try again.';
      setErrorMsg(serverMsg);
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Academic Grade Promotion & Cohort Migration Engine"
      subtitle="Select a specific class cohort and advance pupils to their next academic standard while preserving previous academic histories."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Promotion Strategy Controls: Source Class -> Destination Class */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary-700/60 pb-3">
            <div>
              <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-900 font-black text-[10px] uppercase tracking-wider">
                Class-Wise Academic Progression
              </span>
              <h3 className="text-base font-black text-white mt-1">Select Source & Destination Classes</h3>
            </div>
            <div className="text-xs text-primary-200 font-semibold">
              Academic Session 2026-2027
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* 1. Source Class Dropdown */}
            <div className="md:col-span-5 space-y-1">
              <label className="block text-[11px] font-extrabold text-amber-300 uppercase flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> 1. Source Class (Current Pupils)
              </label>
              {loadingDivisions ? (
                <div className="w-full p-2.5 rounded-xl bg-white/10 text-white text-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading classes...
                </div>
              ) : (
                <select
                  value={sourceDivisionId}
                  onChange={(e) => setSourceDivisionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs border border-primary-400 focus:outline-none cursor-pointer shadow-sm"
                >
                  <option value="all">-- All Standards & Classes (Entire School) --</option>
                  {standards.map((std) => (
                    <optgroup key={std.id} label={`${std.name} (Grade Level ${std.level})`}>
                      {std.divisions?.map((div: any) => (
                        <option key={div.id} value={div.id}>
                          {std.name} — Division {div.name} {div.roomNumber ? `(${div.roomNumber})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {/* Migration Arrow */}
            <div className="md:col-span-1 flex justify-center text-amber-400">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* 2. Target Destination Dropdown */}
            <div className="md:col-span-5 space-y-1">
              <label className="block text-[11px] font-extrabold text-amber-300 uppercase flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> 2. Destination Class (Promoted To)
              </label>
              {loadingDivisions ? (
                <div className="w-full p-2.5 rounded-xl bg-white/10 text-white text-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading classes...
                </div>
              ) : (
                <select
                  value={targetDivisionId}
                  onChange={(e) => setTargetDivisionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs border border-primary-400 focus:outline-none cursor-pointer shadow-sm"
                >
                  <option value="">-- Select Destination Class --</option>
                  {standards.map((std) => (
                    <optgroup key={std.id} label={`${std.name} (Grade Level ${std.level})`}>
                      {std.divisions?.map((div: any) => (
                        <option key={div.id} value={div.id}>
                          {std.name} — Division {div.name} {div.roomNumber ? `(${div.roomNumber})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <optgroup label="Special Graduation Status">
                    <option value="GRADUATED">Graduated / Alumni Archive (Std 12 Completed)</option>
                  </optgroup>
                </select>
              )}
            </div>
          </div>

          {/* Path preview banner */}
          <div className="p-3 bg-white/10 rounded-xl text-xs font-semibold flex items-center justify-between border border-white/15">
            <span className="text-primary-100">Migration Pathway:</span>
            <span className="text-amber-300 font-bold font-mono text-[11px]">
              {getDivLabel(sourceDivisionId)} ➔ {getDivLabel(targetDivisionId)}
            </span>
          </div>
        </div>

        {/* Student Checklist Roster for the Selected Class */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600" />
              <span className="font-extrabold text-slate-800">
                Pupils in Selected Class ({selectedIds.length} of {filteredStudents.length} selected for promotion)
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              disabled={filteredStudents.length === 0}
              className="text-primary-600 hover:text-primary-800 font-bold text-xs disabled:opacity-40"
            >
              {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect All' : 'Select All Class Cohort'}
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">
                No active students enrolled in this class division. Please select a different source class.
              </div>
            ) : (
              filteredStudents.map((s) => {
                const isChecked = selectedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleOne(s.id)}
                    className={`px-5 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked ? 'bg-primary-50/50 hover:bg-primary-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="font-mono text-[11px] text-primary-700 ml-2 font-semibold">
                          GR: {s.grNumber}
                        </span>
                        {s.rollNumber && (
                          <span className="text-slate-400 text-[11px] ml-2">
                            (Roll: {s.rollNumber})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                      {s.division?.standard?.name || 'Standard'} — Div {s.division?.name || 'A'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={promoting}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePromote}
            disabled={selectedIds.length === 0 || promoting || loadingDivisions || !targetDivisionId || sourceDivisionId === targetDivisionId}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition disabled:opacity-50 flex items-center gap-2"
          >
            {promoting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Academic Migration...
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                Promote {selectedIds.length} Pupil(s) to New Class
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StudentPromotionModal;
