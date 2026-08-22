import React, { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import api from '../../services/api';
import { FileSpreadsheet, UploadCloud, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface StaffBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (stats: { successCount: number; failedCount: number; failedRows?: any[] }) => void;
}

const StaffBulkImportModal: React.FC<StaffBulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<{ successCount: number; failedCount: number; failedRows: any[] } | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('spreadsheet', file);

    try {
      const res = await api.post('/staff/bulk-import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReport(res.data.data);
      if (res.data.data.failedCount === 0) {
        setTimeout(() => { onSuccess(res.data.data); onClose(); }, 2000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process staff bulk import workbook.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Staff & Faculty Excel Import"
      subtitle="Partial-Success Import Protocol (PRD Chapter 3.15)"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {!report ? (
          <form onSubmit={handleUpload} className="space-y-5">
            <div className="border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-2xl p-8 text-center bg-slate-50 transition cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <UploadCloud className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">{file ? file.name : 'Click to Browse or Drag & Drop Excel Spreadsheet (.xlsx)'}</h4>
              <p className="text-xs text-slate-400 mt-1">Expected columns: [FirstName, LastName, Gender, DOB, Designation, DepartmentName, Mobile, Email, Address]</p>
            </div>

            <div className="p-4 rounded-xl bg-primary-50 border border-primary-200 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-primary-800">⚡ Enterprise Partial-Success Engine:</p>
              <p>Valid rows will be onboarded immediately with auto-generated Employee IDs and SMS notifications. Any rows with schema violations will be listed without halting the entire migration.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs">Cancel</button>
              <button
                type="submit"
                disabled={!file || uploading}
                className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/30 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? 'Processing & Validating Spreadsheet...' : 'Execute Partial-Success Migration'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 animate-in fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Successfully Imported
                </div>
                <h3 className="text-3xl font-black mt-2">{report.successCount} Staff</h3>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">Credentials generated & sent</p>
              </div>

              <div className={`p-4 rounded-2xl border ${report.failedCount > 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertCircle className={`w-5 h-5 ${report.failedCount > 0 ? 'text-red-600' : 'text-slate-400'}`} /> Failed / Skipped Rows
                </div>
                <h3 className="text-3xl font-black mt-2">{report.failedCount} Rows</h3>
                <p className="text-[11px] mt-1">{report.failedCount > 0 ? 'Review validation exceptions below' : 'Zero errors in sheet'}</p>
              </div>
            </div>

            {report.failedRows && report.failedRows.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-xs text-slate-700 border-b border-slate-200">
                  Exception Diagnostic Log (Partial-Success Exclusions)
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {report.failedRows.map((f: any, i: number) => (
                    <div key={i} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">Row {f.rowNumber}:</span> <span className="text-slate-600 font-mono">{f.email}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[11px]">{f.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => { onSuccess(report); onClose(); }}
                className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                Accept Results & Return to Roster <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StaffBulkImportModal;
