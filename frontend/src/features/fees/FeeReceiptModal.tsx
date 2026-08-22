import React from 'react';
import Modal from '../../components/Modal/Modal';
import { Download, FileText, CheckCircle2, Coins } from 'lucide-react';

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeData: any;
}

const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({ isOpen, onClose, feeData }) => {
  if (!isOpen || !feeData) return null;

  const triggerPdfDownload = () => {
    // Connect to backend PDFKit receipt generator using proxy/relative URL from env
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
    const url = `${apiBaseUrl}/fees/receipt/pdf?receiptId=${feeData.id}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Fee Payment Receipt"
      subtitle={`Receipt Number: ${feeData.receiptNumber || 'DJMHS-REC-000042'} — Institutional Accounting Document`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        
        {/* Receipt Document Container */}
        <div className="p-8 bg-white border-2 border-slate-300 rounded-2xl shadow-inner relative space-y-6 text-slate-800">
          
          <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-800 pb-5 gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-900 via-primary-800 to-indigo-900 text-accent-400 font-black text-2xl flex items-center justify-center shadow">
                DJMHS
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-primary-950">
                  Shree Dhaneshkumar Jasvantlal Maheta High School
                </h3>
                <p className="text-xs font-bold text-slate-500">Recognized by GSEB | Krishnangar Bhavnagar, Gujarat</p>
                <p className="text-[11px] text-amber-700 font-extrabold uppercase mt-0.5">Official Student Fee Payment Voucher</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-black text-primary-700 block">{feeData.receiptNumber || 'DJMHS-REC-000001'}</span>
              <span className="text-xs text-slate-500 font-medium">Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Student Dossier */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium">
            <div>
              <span className="text-slate-400 font-bold uppercase block">Student Name</span>
              <span className="font-black text-slate-900 text-sm">{feeData.student?.firstName || 'Parthiv'} {feeData.student?.lastName || 'Mehta'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block">GR Number</span>
              <span className="font-mono font-extrabold text-primary-700">{feeData.student?.grNumber || 'DJMHS-GR-000001'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block">Standard & Division</span>
              <span className="font-black text-slate-900">{feeData.student?.division?.standard?.name || 'Standard 10'} — Div {feeData.student?.division?.name || 'A'}</span>
            </div>
          </div>

          {/* Fee Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white uppercase font-bold">
                  <th className="py-3 px-4">Fee Installment Description</th>
                  <th className="py-3 px-4 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-sm">
                <tr>
                  <td className="py-4 px-4 text-slate-800">{feeData.title || 'Term 1 Comprehensive Tuition & Lab Fee'}</td>
                  <td className="py-4 px-4 text-right text-slate-900 font-black">₹{feeData.amount?.toLocaleString() || '12,500'}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-sm border-t-2 border-slate-800">
                  <td className="py-3.5 px-4 uppercase text-slate-900">Total Payment Settled</td>
                  <td className="py-3.5 px-4 text-right text-primary-700 text-base">₹{feeData.amount?.toLocaleString() || '12,500'}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Payment Mode: <strong>ONLINE_UPI / CHEQUE</strong> | Trans Hash: UPI-{Date.now().toString().slice(-8)}</span>
            </div>
            <div className="text-center pt-4 sm:pt-0">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Authorized Treasury Signatory</span>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs">Close</button>
          <button
            onClick={triggerPdfDownload}
            className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-black text-xs shadow-lg shadow-primary-600/30 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Official Fee Receipt PDF
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default FeeReceiptModal;
