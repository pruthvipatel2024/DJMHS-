import React, { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import StudentService from '../../services/student.service';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const StudentImportModal: React.FC<StudentImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setPreviewData(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await StudentService.previewImport(file);
      setPreviewData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to parse Excel file. Please check format.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.validRows || previewData.validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await StudentService.confirmImport(previewData.importJobId, previewData.validRows);
      onSuccess(res.data.importedCount);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm bulk import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Student & New Admission Excel Import Engine"
      subtitle="Upload institutional student Excel template for validated onboarding with duplicate GR detection."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {!previewData ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-primary-200 bg-primary-50/50 rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center mx-auto shadow-md">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-base">Select Student Excel Workbook (.xlsx)</h4>
                <p className="text-xs text-slate-500 mt-1">Template columns: GR Number, Roll No, First Name, Last Name, Gender, DOB, Standard, Division, Father Name, Parent Phone, Address</p>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel_upload_input"
              />
              <label
                htmlFor="excel_upload_input"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 font-extrabold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
              >
                <Upload className="w-4 h-4 text-primary-600" />
                {file ? file.name : 'Choose File'}
              </label>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                disabled={!file || loading}
                onClick={handlePreview}
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md"
              >
                {loading ? 'Validating Workbook...' : 'Validate & Preview Data'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Valid Rows ({previewData.validRows?.length || 0})
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">Ready for transaction commit to General Register</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Duplicates Rejected ({previewData.duplicateRows?.length || 0})
                </div>
                <p className="text-[11px] text-amber-700 mt-1">Existing GR numbers detected & skipped</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                  <XCircle className="w-4 h-4 text-rose-600" /> Invalid Rows ({previewData.invalidRows?.length || 0})
                </div>
                <p className="text-[11px] text-rose-700 mt-1">Missing required fields or formatting errors</p>
              </div>
            </div>

            {/* Valid Rows Preview Table */}
            {previewData.validRows?.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">GR Number</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">Gender</th>
                      <th className="p-2.5">Division</th>
                      <th className="p-2.5">Parent Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {previewData.validRows.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-500">{r.rowNumber}</td>
                        <td className="p-2.5 font-mono text-primary-700 font-bold">{r.grNumber || 'Auto-Generate'}</td>
                        <td className="p-2.5 font-bold text-slate-800">{r.firstName} {r.lastName}</td>
                        <td className="p-2.5 text-slate-600">{r.gender}</td>
                        <td className="p-2.5 text-slate-700">{r.divisionLabel}</td>
                        <td className="p-2.5 text-slate-700">{r.parentPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button onClick={() => setPreviewData(null)} className="text-xs font-bold text-primary-600 hover:underline">
                ← Upload Different File
              </button>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  disabled={!previewData.validRows?.length || importing}
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  {importing ? 'Onboarding Students...' : `Confirm Import (${previewData.validRows?.length || 0} Students)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StudentImportModal;
