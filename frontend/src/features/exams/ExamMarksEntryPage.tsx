import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookOpenCheck, Save, ArrowLeft, CheckCircle2, AlertCircle, Check, Sparkles, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import StorageService from '../../utils/storage.utils';
import useUnsavedWarning from '../../utils/useUnsavedWarning';

const ExamMarksEntryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get('examId') || '';

  const savedFilters = useMemo(() => {
    return examId ? StorageService.get<{ subject?: string; division?: string }>(`sdjm_marks_filters_${examId}`, {}) : {};
  }, [examId]);

  const [selectedSubject, setSelectedSubject] = useState<string>(savedFilters.subject || 'sub_acc');
  const [selectedDivision, setSelectedDivision] = useState<string>(savedFilters.division || '');
  
  const [divisions, setDivisions] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Warn on accidental tab close or page refresh if unsaved marks exist
  useUnsavedWarning(isDirty, 'You have unsubmitted marks entered in this examination register. Are you sure you want to refresh? Your entered scores have been preserved.');

  const marksDraftKey = useMemo(() => {
    return examId && selectedSubject && selectedDivision
      ? `sdjm_marks_draft_${examId}_${selectedSubject}_${selectedDivision}`
      : null;
  }, [examId, selectedSubject, selectedDivision]);

  // Persist active subject & division filters
  useEffect(() => {
    if (examId && (selectedSubject || selectedDivision)) {
      StorageService.set(`sdjm_marks_filters_${examId}`, {
        subject: selectedSubject,
        division: selectedDivision,
      });
    }
  }, [examId, selectedSubject, selectedDivision]);

  // Helper for live Grade preview in browser
  const computeLiveGrade = (val: string | number, max: number = 100) => {
    const num = Number(val);
    if (val === '' || isNaN(num)) return { grade: '-', color: 'text-slate-400 bg-slate-100' };
    const pct = (num / max) * 100;
    if (pct >= 90) return { grade: 'A+', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' };
    if (pct >= 80) return { grade: 'A', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 70) return { grade: 'B+', color: 'text-indigo-800 bg-indigo-100 border-indigo-300' };
    if (pct >= 60) return { grade: 'B', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (pct >= 50) return { grade: 'C', color: 'text-amber-800 bg-amber-100 border-amber-300' };
    if (pct >= 35) return { grade: 'D', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { grade: 'F (Fail)', color: 'text-red-800 bg-red-100 border-red-300 font-black' };
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await api.get('/settings');
        const list: any[] = [];
        if (res.data?.data?.standards) {
          res.data.data.standards.forEach((std: any) => {
            std.divisions?.forEach((div: any) => {
              list.push({ id: div.id, name: `${std.name} — Division ${div.name}` });
            });
          });
        }
        setDivisions(list);
        if (list.length > 0) {
          const defaultDiv = savedFilters.division && list.some(d => d.id === savedFilters.division)
            ? savedFilters.division
            : list[0].id;
          setSelectedDivision(defaultDiv);
        }
      } catch (e) {
        setDivisions([]);
      }
    };
    fetchMetadata();
  }, [savedFilters.division]);

  const fetchMarkSheet = useCallback(async () => {
    if (!examId || !selectedDivision) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/exams/marksheet', { params: { examId, subjectId: selectedSubject, divisionId: selectedDivision } });
      let currentRoster = res.data.data.roster || [];

      // Check for cached in-progress marks draft
      const currentDraftKey = `sdjm_marks_draft_${examId}_${selectedSubject}_${selectedDivision}`;
      const savedDraft = StorageService.get<Record<string, { marksObtained?: string | number; remarks?: string }> | null>(currentDraftKey, null);

      if (savedDraft && Object.keys(savedDraft).length > 0) {
        currentRoster = currentRoster.map((item: any) => {
          const draftItem = savedDraft[item.studentId];
          if (draftItem) {
            return {
              ...item,
              marksObtained: draftItem.marksObtained !== undefined ? draftItem.marksObtained : item.marksObtained,
              remarks: draftItem.remarks !== undefined ? draftItem.remarks : item.remarks,
            };
          }
          return item;
        });
        setDraftRestored(true);
        setIsDirty(true);
      } else {
        setDraftRestored(false);
        setIsDirty(false);
      }

      setRoster(currentRoster);
    } catch (e: any) {
      setRoster([]);
      setErrorMsg(e.response?.data?.message || 'Unable to load examination mark sheet for selected division.');
    } finally {
      setLoading(false);
    }
  }, [examId, selectedSubject, selectedDivision]);

  useEffect(() => {
    fetchMarkSheet();
  }, [fetchMarkSheet]);

  const saveDraftToStorage = (updatedRoster: any[]) => {
    if (marksDraftKey) {
      const draftMap: Record<string, { marksObtained: any; remarks: string }> = {};
      updatedRoster.forEach((r) => {
        draftMap[r.studentId] = {
          marksObtained: r.marksObtained,
          remarks: r.remarks || '',
        };
      });
      StorageService.set(marksDraftKey, draftMap);
      setIsDirty(true);
    }
  };

  const handleDiscardDraft = () => {
    if (marksDraftKey) {
      StorageService.remove(marksDraftKey);
    }
    setDraftRestored(false);
    setIsDirty(false);
    fetchMarkSheet();
  };

  const updateMark = (studentId: string, val: string) => {
    const num = Number(val);
    if (val !== '' && (isNaN(num) || num < 0 || num > 100)) return;
    const newRoster = roster.map(item => item.studentId === studentId ? { ...item, marksObtained: val } : item);
    setRoster(newRoster);
    saveDraftToStorage(newRoster);
  };

  const updateRemarks = (studentId: string, text: string) => {
    const newRoster = roster.map(item => item.studentId === studentId ? { ...item, remarks: text } : item);
    setRoster(newRoster);
    saveDraftToStorage(newRoster);
  };

  const handleSave = async () => {
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await api.post('/exams/marks', {
        examId,
        subjectId: selectedSubject,
        records: roster.map(r => ({ studentId: r.studentId, marksObtained: r.marksObtained, maxMarks: r.maxMarks, remarks: r.remarks || '' }))
      });

      if (marksDraftKey) {
        StorageService.remove(marksDraftKey);
      }
      setIsDirty(false);
      setDraftRestored(false);

      setSuccessMsg('Scores saved successfully into PostgreSQL database!');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to submit examination marks.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <button
        onClick={() => navigate('/admin/exams')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Examination Schedule Console
      </button>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {successMsg}
        </div>
      )}

      {draftRestored && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="font-extrabold block">In-Progress Examination Marks Draft Restored</span>
              <span className="font-medium text-indigo-700">Your previously entered scores and faculty remarks have been restored across page refresh. Click "Save Marks Entry" when finished.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs whitespace-nowrap shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Discard Draft
          </button>
        </div>
      )}

      {/* Control Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
            Faculty Grading Ledger (PRD Chapter 6)
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Examination Marks Entry Register</h2>
          <p className="text-xs text-slate-500">Enter scores out of 100. Grades (A+, A, B+, B, C, D, Fail) are automatically computed instantly with zero manual calculation.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="p-2.5 border border-slate-300 rounded-xl text-xs font-black text-slate-800 bg-white cursor-pointer"
            >
              <option value="sub_acc">Elements of Accounts & Bookkeeping</option>
              <option value="sub_stat">Commercial Statistics & Mathematics</option>
              <option value="sub_econ">Economics & Business Administration</option>
              <option value="sub_eng">English & Business Communication</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Standard Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="p-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white cursor-pointer"
            >
              {divisions.length === 0 ? (
                <option value="">-- No Divisions Available --</option>
              ) : (
                divisions.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Mark Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-700 flex items-center justify-between">
          <span>Student Roster Scoring Grid ({roster.length} Pupils)</span>
          <span>Boundary limits: 0 — 100 Marks</span>
        </div>

        {loading ? <LoadingSkeleton rows={5} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">Roll</th>
                  <th className="py-3 px-4">GR Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 w-36 text-center">Marks (Out of 100)</th>
                  <th className="py-3 px-4 w-32 text-center">Auto Grade</th>
                  <th className="py-3 px-4">Teacher Comments & Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {roster.map((s) => {
                  const { grade, color } = computeLiveGrade(s.marksObtained, s.maxMarks || 100);
                  return (
                    <tr key={s.studentId} className="hover:bg-primary-50/20 transition">
                      <td className="py-3.5 px-4 text-center font-black text-slate-800">{s.rollNumber}</td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-primary-700">{s.grNumber}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">{s.firstName} {s.lastName}</td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={s.marksObtained}
                          onChange={(e) => updateMark(s.studentId, e.target.value)}
                          className="w-24 p-2 text-center border-2 border-slate-300 rounded-xl font-black text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${color} inline-block min-w-[50px] text-center shadow-xs`}>
                          {grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          placeholder="e.g. Needs revision in chapter 4"
                          value={s.remarks || ''}
                          onChange={(e) => updateRemarks(s.studentId, e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-8 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm shadow-xl shadow-primary-600/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Verifying & Committing Scores...' : 'Lock Scores & Commit Results to Database'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default ExamMarksEntryPage;
