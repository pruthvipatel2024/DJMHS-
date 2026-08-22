import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import { Download, Printer, Award, BookOpen, CheckCircle2 } from 'lucide-react';
import ExamService from '../../services/exam.service';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: any;
  studentId?: string;
}

const ReportCardModal: React.FC<ReportCardModalProps> = ({ isOpen, onClose, exam, studentId }) => {
  const [marksList, setMarksList] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !exam) return;
    const fetchResult = async () => {
      setLoading(true);
      try {
        const data = await ExamService.getStudentResult(studentId || 'std_01', exam.id);
        setMarksList(data?.marks || []);
        setRemarks(data?.remarks || 'Satisfactory academic progress.');
      } catch (e) {
        setMarksList([]);
        setRemarks('');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [isOpen, exam, studentId]);

  if (!isOpen || !exam) return null;

  const totalObtained = marksList.reduce((acc, curr) => acc + (Number(curr.marksObtained) || 0), 0);
  const totalMax = marksList.reduce((acc, curr) => acc + (Number(curr.maxMarks) || 100), 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0';

  const triggerPdfDownload = () => {
    // Connect to backend PDFKit route using proxy/relative URL from env
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
    const url = `${apiBaseUrl}/exams/report-card/pdf?studentId=std_01&examId=${exam.id}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Student Term Report Card"
      subtitle="Shree Dhaneshkumar Jasvantlal Maheta High School (Bhavnagar Campus — Est. 1959)"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        
        {/* Report Card Document Shell */}
        <div className="p-8 bg-white border-2 border-slate-300 rounded-2xl shadow-inner relative space-y-6 text-slate-800">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-800 pb-6 text-center sm:text-left gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-800 to-primary-950 text-accent-400 font-black text-2xl flex items-center justify-center shadow-md">
                DJMHS
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-primary-950">
                  Shree Dhaneshkumar Jasvantlal Maheta High School
                </h3>
                <p className="text-xs font-bold text-slate-500">Recognized by Gujarat Secondary Education Board | Est. 1959 Bhavnagar</p>
                <p className="text-[11px] text-primary-700 font-extrabold uppercase mt-0.5">Academic Session 2026-2027 Term Progress Report Card</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase border border-emerald-300">
                Official Result
              </span>
            </div>
          </div>

          {/* Student Dossier Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium">
            <div>
              <span className="text-slate-400 font-bold uppercase block">Student Name</span>
              <span className="font-black text-slate-900 text-sm">Parthiv Arvindbhai Mehta</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block">GR Number</span>
              <span className="font-mono font-black text-primary-700 text-sm">DJMHS-GR-000001</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block">Standard & Division</span>
              <span className="font-black text-slate-900">Standard 10 — Div A</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block">Examination Term</span>
              <span className="font-black text-indigo-900">{exam.name || 'Term 1 Assessment'}</span>
            </div>
          </div>

          {/* Marks Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white uppercase font-bold">
                  <th className="py-3 px-4">Subject Description</th>
                  <th className="py-3 px-4 text-center">Maximum Marks</th>
                  <th className="py-3 px-4 text-center">Marks Obtained</th>
                  <th className="py-3 px-4 text-center">Letter Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold">
                {marksList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                      No evaluation marks entered for this exam yet.
                    </td>
                  </tr>
                ) : (
                  marksList.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">{m.subject?.name || m.subjectName || 'Subject'}</td>
                      <td className="py-3.5 px-4 text-center text-slate-500">{m.maxMarks || 100}</td>
                      <td className="py-3.5 px-4 text-center text-slate-900 font-black text-sm">{m.marksObtained}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded bg-primary-50 text-primary-800 font-black border border-primary-200">
                          {m.grade || 'A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-sm border-t-2 border-slate-800">
                  <td className="py-3 px-4 uppercase text-slate-900">Total Term Aggregate</td>
                  <td className="py-3 px-4 text-center text-slate-800">{totalMax}</td>
                  <td className="py-3 px-4 text-center text-primary-700 font-black text-base">{totalObtained}</td>
                  <td className="py-3 px-4 text-center font-extrabold text-emerald-700">{percentage}%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures & Remarks */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-xs text-slate-600 font-semibold gap-6">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">HOD / Class Teacher Remarks</span>
              <p className="font-extrabold text-slate-800 italic">"{remarks || 'No remarks recorded.'}"</p>
            </div>
            <div className="flex items-center gap-8 text-center pt-4 sm:pt-0">
              <div>
                <div className="w-32 border-b border-slate-400 mb-1"></div>
                <span className="text-[11px] font-bold text-slate-500">Class Teacher Sign</span>
              </div>
              <div>
                <div className="w-32 border-b border-slate-400 mb-1"></div>
                <span className="text-[11px] font-bold text-slate-500">Principal Sign</span>
              </div>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50">
            Close Viewer
          </button>
          <button
            onClick={triggerPdfDownload}
            className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-slate-900 font-black text-xs shadow-lg shadow-accent-500/20 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Official Report Card PDF
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default ReportCardModal;
