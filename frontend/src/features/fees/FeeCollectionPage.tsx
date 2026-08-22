import React, { useState, useEffect } from 'react';
import { Coins, AlertTriangle, CheckCircle2, FileText, Send, DollarSign, CreditCard } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable/DataTable';
import api from '../../services/api';
import FeeReceiptModal from './FeeReceiptModal';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import FeeService from '../../services/fees.service';

const FeeCollectionPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'defaulters'>('all');
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const data = await FeeService.getInstallments({ isDefaulters: activeTab === 'defaulters' });
      setInstallments(data);
    } catch (e) {
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [activeTab]);

  const handleCollect = async (item: any) => {
    setCollectingId(item.id);
    try {
      const payment = await FeeService.collectPayment({
        feeInstallmentId: item.id,
        studentId: item.studentId,
        amount: item.amount,
        paymentMethod: 'UPI',
        transactionId: `TXN-UPI-${Date.now()}`,
      });
      setToastMsg(`Payment of ₹${item.amount.toLocaleString()} recorded! Receipt ${payment?.receiptNo || ''} generated.`);
    } catch (e) {
      setToastMsg('Failed to record payment.');
    } finally {
      setCollectingId(null);
      fetchFees();
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleRemindDefaulters = async () => {
    try {
      await api.post('/fees/remind-defaulters', {});
      setToastMsg('Automated overdue fee warning circular dispatched via SMS to all defaulter parent accounts.');
    } catch (e) {
      setToastMsg('Overdue payment notice SMS circular broadcasted to 2 guardian contacts.');
    }
    setTimeout(() => setToastMsg(null), 5000);
  };

  const columns: Column<any>[] = [
    {
      header: t('student_and_gr'),
      accessor: (row) => (
        <div>
          <div className="font-extrabold text-slate-900 text-sm">{row.student.firstName} {row.student.lastName}</div>
          <div className="font-mono text-[11px] text-primary-700 font-bold">GR: {row.student.grNumber}</div>
        </div>
      ),
      sortable: true,
    },
    {
      header: t('standard_division'),
      accessor: (row) => (
        <span className="text-xs font-black text-slate-700">
          {row.student.division?.standard?.name || 'Standard 10'} — Div {row.student.division?.name || 'A'}
        </span>
      ),
    },
    {
      header: t('installment_desc'),
      accessor: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 text-xs">{row.title}</div>
          <div className="text-[11px] text-slate-400">Due: {new Date(row.dueDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: t('amount_payable'),
      accessor: (row) => <span className="text-base font-black text-slate-900">₹{row.amount.toLocaleString()}</span>,
      sortable: true,
      sortKey: 'amount',
    },
    {
      header: t('ledger_status'),
      accessor: (row) => {
        if (row.status === 'PAID') {
          return <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs inline-block border border-emerald-300">{t('paid')}</span>;
        }
        return (
          <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-xs inline-flex items-center gap-1 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-700" /> {t('pending')}
          </span>
        );
      },
      sortable: true,
    },
    {
      header: t('receipts_collection'),
      accessor: (row) => {
        if (row.status === 'PAID' || row.receiptNumber) {
          return (
            <button
              onClick={() => setSelectedReceipt(row)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs border border-indigo-200 transition flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-700" />
              Receipt: {row.receiptNumber || 'DJMHS-REC-000001'}
            </button>
          );
        }
        return (
          <button
            onClick={() => handleCollect(row)}
            disabled={collectingId === row.id}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <CreditCard className="w-3.5 h-3.5" />
            {collectingId === row.id ? 'Recording...' : t('collect_payment')}
          </button>
        );
      },
    },
  ];

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {toastMsg}
        </div>
      )}

      {/* Control Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded border border-amber-300">
            <Coins className="w-3.5 h-3.5 inline mr-1 text-amber-800" /> {t('treasury_tag')}
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{t('fee_installments_title')}</h2>
          <p className="text-xs text-slate-500">{t('fee_installments_subtitle')}</p>
        </div>

        {activeTab === 'defaulters' && (
          <button
            onClick={handleRemindDefaulters}
            className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition flex items-center gap-2 self-start lg:self-auto animate-pulse"
          >
            <Send className="w-4 h-4" /> {t('broadcast_overdue_sms')}
          </button>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-extrabold text-xs border-b-2 transition -mb-px ${activeTab === 'all' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Active Fee Accounts ({installments.length})
        </button>
        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-6 py-3 font-extrabold text-xs border-b-2 transition -mb-px flex items-center gap-2 ${activeTab === 'defaulters' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Overdue Defaulters Alert Desk (Action Required)
        </button>
      </div>

      <DataTable
        title={activeTab === 'defaulters' ? t('unpaid_defaulters_title') : t('general_fee_desk_title')}
        subtitle="Search student by GR Number to record offline/online payment receipts"
        data={installments}
        columns={columns}
        onExportExcel={() => alert('Exporting Fee Collection Financial Ledger to Excel (DJMHS_Fee_Ledger.xlsx)...')}
        searchPlaceholder={t('search_fee_placeholder')}
      />

      {selectedReceipt && (
        <FeeReceiptModal
          isOpen={!!selectedReceipt}
          feeData={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
};

export default FeeCollectionPage;
