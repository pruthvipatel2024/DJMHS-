import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import ExamService from '../../services/exam.service';
import { Calendar, BookOpen, Layers, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface ScheduleExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (examName: string) => void;
}

const EXAM_TYPES = [
  { value: 'UNIT_TEST_1', label: 'Unit Test 1 (Periodical Evaluation)' },
  { value: 'QUARTERLY', label: 'Quarterly Term Assessment' },
  { value: 'UNIT_TEST_2', label: 'Unit Test 2 (Periodical Evaluation)' },
  { value: 'HALF_YEARLY', label: 'Half-Yearly / Term 1 Summative Exam' },
  { value: 'PRELIMINARY', label: 'Preliminary Board Pattern Exam' },
  { value: 'ANNUAL_FINAL', label: 'Annual Final Examination' },
];

const ScheduleExamModal: React.FC<ScheduleExamModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [standardId, setStandardId] = useState('');
  const [examType, setExamType] = useState('HALF_YEARLY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [standards, setStandards] = useState<any[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default dates on open
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(nextWeek);
      setName('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Load standards
  useEffect(() => {
    if (!isOpen) return;
    const fetchStandards = async () => {
      setLoadingMetadata(true);
      try {
        const res = await api.get('/settings');
        const stdList = res.data?.data?.standards || [];
        setStandards(stdList);
        if (stdList.length > 0 && !standardId) {
          setStandardId(stdList[0].id);
        }
      } catch (err) {
        setStandards([]);
      } finally {
        setLoadingMetadata(false);
      }
    };
    fetchStandards();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please specify an official Examination Session Name.');
      return;
    }
    if (!standardId) {
      setErrorMsg('Please select a target Academic Standard.');
      return;
    }
    if (!startDate) {
      setErrorMsg('Please choose an Exam Start Date.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await ExamService.createExam({
        name: name.trim(),
        standardId,
        examType,
        startDate,
        endDate: endDate || startDate,
        isPublished,
      } as any);

      onSuccess(name.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to establish exam session. Please check your network.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Examination Session"
      subtitle="Establish institutional examination terms, assign standards, and configure timetable timeline"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Exam Title */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary-600" />
            Official Examination Title *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => { setName(e.target.value); setErrorMsg(null); }}
            placeholder="e.g. Term 1 Summative Examination 2026-2027"
            className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>

        {/* Standard and Exam Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary-600" />
              Target Academic Standard *
            </label>
            <select
              value={standardId}
              onChange={(e) => setStandardId(e.target.value)}
              disabled={loadingMetadata}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {standards.length === 0 ? (
                <option value="">-- Loading Standards --</option>
              ) : (
                standards.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.name} ({std.divisions?.length || 0} Divisions)
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Examination Category *
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Commencement Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Conclusion Date *
            </label>
            <input
              type="date"
              required
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Publish Checkbox */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-slate-800">Publish Schedule to Student & Parent Portals</div>
            <div className="text-[11px] text-slate-500">Allow students and guardians to view dates and subject evaluation schedule immediately.</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? 'Scheduling Examination...' : 'Establish Exam Session'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleExamModal;
