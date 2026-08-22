import React, { useState, useEffect } from 'react';
import { Plus, Upload, FileSpreadsheet, Users, Filter, CheckCircle2 } from 'lucide-react';
import DataTable, { Column } from '../../components/DataTable/DataTable';
import api from '../../services/api';
import StaffFormModal from './StaffFormModal';
import StaffOcrImportModal from './StaffOcrImportModal';
import ConfirmDialog from '../../components/States/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';

import StaffService from '../../services/staff.service';

const StaffListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await StaffService.getStaff({ departmentId: selectedDept || undefined });
      setStaffList(data);
    } catch (e) {
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [selectedDept]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await StaffService.deleteStaff(confirmDeleteId);
      setToastMsg('Staff personnel record deactivated successfully.');
      fetchStaff();
    } catch (e) {
      setToastMsg('Failed to deactivate staff record.');
    }
    setConfirmDeleteId(null);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const columns: Column<any>[] = [
    {
      header: t('employee_id'),
      accessor: 'empId',
      sortable: true,
      className: 'font-bold text-primary-700',
    },
    {
      header: t('faculty_name'),
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-extrabold flex items-center justify-center text-xs shadow-xs">
            {row.firstName[0]}
          </div>
          <div>
            <div className="font-extrabold text-slate-800">{row.firstName} {row.lastName}</div>
            <div className="text-[11px] text-slate-400 font-medium">{row.email}</div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'firstName',
    },
    {
      header: t('department'),
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200/60">
          {row.department?.name || t('assigned_faculty')}
        </span>
      ),
      sortable: true,
    },
    {
      header: t('designation'),
      accessor: 'designation',
      sortable: true,
    },
    {
      header: t('contact_number'),
      accessor: 'phone',
      className: 'font-mono text-slate-600',
    },
  ];

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-200">
            <Users className="w-3.5 h-3.5" /> {t('staff_roster_tag')}
          </div>
          <h2 className="text-2xl font-black text-slate-900">{t('staff_page_title')}</h2>
          <p className="text-xs text-slate-500">{t('staff_page_subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-2 shadow-xs"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            {t('bulk_import')}
          </button>

          <button
            onClick={() => { setEditingStaff(null); setShowFormModal(true); }}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition shadow-md shadow-primary-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('onboard_new_staff')}
          </button>
        </div>
      </div>

      {/* Main Grid Table */}
      <DataTable
        title={t('staff_directory_table_title')}
        subtitle={t('staff_directory_table_subtitle').replace('{{count}}', staffList.length.toString())}
        data={staffList}
        columns={columns}
        onEdit={(item) => { setEditingStaff(item); setShowFormModal(true); }}
        onDelete={(item) => setConfirmDeleteId(item.id)}
        onRowClick={(item) => navigate(`/admin/staff/${item.id}`)}
        onExportExcel={() => { alert('Exporting Staff Roster to Excel spreadsheet (DJMHS_Staff_Roster.xlsx)...'); }}
        searchPlaceholder={t('search_placeholder')}
      />

      {showFormModal && (
        <StaffFormModal
          isOpen={showFormModal}
          initialData={editingStaff}
          onClose={() => setShowFormModal(false)}
          onSuccess={(saved) => {
            fetchStaff();
            setToastMsg(editingStaff ? 'Staff profile updated successfully.' : 'Staff onboarded successfully! Login credentials dispatched.');
            setTimeout(() => setToastMsg(null), 4000);
          }}
        />
      )}

      {showImportModal && (
        <StaffOcrImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={(stats) => {
            fetchStaff();
            setToastMsg(`Bulk import completed! Successfully onboarded ${stats.successCount} faculty records.`);
            setTimeout(() => setToastMsg(null), 5000);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title={t('deactivate_staff_title')}
        message={t('deactivate_staff_msg')}
        confirmText={t('deactivate_record')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default StaffListPage;
