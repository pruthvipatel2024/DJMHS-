import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Plus,
  CheckCircle2,
  Shield,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Save,
  BookOpen,
  UserCheck,
  Users,
  Layers,
  Filter,
  Search,
  Check,
  School,
  Sparkles,
  Info,
} from 'lucide-react';
import api from '../../services/api';
import SettingsService, { SubjectItem, StaffSubjectAllocation } from '../../services/settings.service';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import Modal from '../../components/Modal/Modal';
import { useTranslation } from 'react-i18next';

import StorageService from '../../utils/storage.utils';
import useUnsavedWarning from '../../utils/useUnsavedWarning';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'standards' | 'subjects' | 'allocations' | 'backup'>(
    StorageService.get('sdjm_settings_tab', 'general')
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    settings: [],
    departments: [],
    standards: [],
    subjects: [],
  });

  const [staffList, setStaffList] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<StaffSubjectAllocation[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // General tab states
  const [newDeptName, setNewDeptName] = useState('');
  const [newStdName, setNewStdName] = useState('');
  const [newStdLevel, setNewStdLevel] = useState('11');

  // Edit states for Departments
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptDesc, setEditDeptDesc] = useState('');

  // Edit states for Standards
  const [editingStdId, setEditingStdId] = useState<string | null>(null);
  const [editStdName, setEditStdName] = useState('');

  // Add & Edit states for Divisions
  const [addingDivStdId, setAddingDivStdId] = useState<string | null>(null);
  const [newDivName, setNewDivName] = useState('');
  const [newDivRoom, setNewDivRoom] = useState('');

  const [editingDivId, setEditingDivId] = useState<string | null>(null);
  const [editDivName, setEditDivName] = useState('');
  const [editDivRoom, setEditDivRoom] = useState('');

  // ================= SUBJECT MANAGEMENT STATES =================
  const [subjectFilterStdId, setSubjectFilterStdId] = useState<string>('ALL');
  const [subjectSearch, setSubjectSearch] = useState<string>('');
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubStdId, setNewSubStdId] = useState<string>('');
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubCode, setNewSubCode] = useState<string>('');
  const [newSubIsOptional, setNewSubIsOptional] = useState<boolean>(false);

  // Edit Subject state
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubCode, setEditSubCode] = useState('');
  const [editSubStdId, setEditSubStdId] = useState('');
  const [editSubIsOptional, setEditSubIsOptional] = useState(false);

  // ================= TEACHER ALLOCATION STATES =================
  const [allocationViewMode, setAllocationViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedAllocStdId, setSelectedAllocStdId] = useState<string>('');
  const [selectedAllocDivId, setSelectedAllocDivId] = useState<string>('');
  const [classSubjectAssignments, setClassSubjectAssignments] = useState<Record<string, string>>({}); // subjectId -> staffId
  const [allocSearchTeacher, setAllocSearchTeacher] = useState<string>('');
  const [savingAllocations, setSavingAllocations] = useState(false);

  const isSettingsDirty = !!(
    newDeptName ||
    newStdName ||
    editDeptName ||
    editStdName ||
    newDivName ||
    editDivName ||
    newSubName
  );
  useUnsavedWarning(isSettingsDirty, 'You have uncommitted settings entries. Are you sure you want to refresh?');

  useEffect(() => {
    StorageService.set('sdjm_settings_tab', activeTab);
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const [settingsRes, staffRes, allocationsRes] = await Promise.all([
        api.get('/settings'),
        api.get('/staff'),
        SettingsService.getSubjectAllocations(),
      ]);

      if (settingsRes.data?.data) {
        const settingsData = settingsRes.data.data;
        setData(settingsData);

        // Pre-select first standard and division for allocation tab
        if (settingsData.standards?.length > 0) {
          if (!newSubStdId) setNewSubStdId(settingsData.standards[0].id);
          if (!selectedAllocStdId) {
            setSelectedAllocStdId(settingsData.standards[0].id);
            if (settingsData.standards[0].divisions?.length > 0) {
              setSelectedAllocDivId(settingsData.standards[0].divisions[0].id);
            }
          }
        }
      }

      if (staffRes.data?.data) {
        setStaffList(staffRes.data.data);
      }

      if (allocationsRes) {
        setAllocations(allocationsRes);
      }
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Unable to load institutional parameters from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update division dropdown when standard changes in allocation tab
  useEffect(() => {
    if (selectedAllocStdId) {
      const std = data.standards?.find((s: any) => s.id === selectedAllocStdId);
      if (std && std.divisions?.length > 0) {
        // If current selected division does not belong to this standard, select the first division
        if (!std.divisions.some((d: any) => d.id === selectedAllocDivId)) {
          setSelectedAllocDivId(std.divisions[0].id);
        }
      } else {
        setSelectedAllocDivId('');
      }
    }
  }, [selectedAllocStdId, data.standards]);

  // Sync class assignments map when selected division changes
  useEffect(() => {
    if (!selectedAllocDivId) {
      setClassSubjectAssignments({});
      return;
    }

    const divisionAllocations = allocations.filter((a) => a.divisionId === selectedAllocDivId);
    const map: Record<string, string> = {};
    divisionAllocations.forEach((a) => {
      map[a.subjectId] = a.staffId;
    });

    // Also check standard divisions embedded in settings data
    const std = data.standards?.find((s: any) => s.id === selectedAllocStdId);
    const div = std?.divisions?.find((d: any) => d.id === selectedAllocDivId);
    if (div?.subjectMappings) {
      div.subjectMappings.forEach((m: any) => {
        if (m.subjectId && m.staff?.id) {
          map[m.subjectId] = m.staff.id;
        }
      });
    }

    setClassSubjectAssignments(map);
  }, [selectedAllocDivId, selectedAllocStdId, allocations, data.standards]);

  // Compute teacher multi-class workload summary
  // Key: staffId -> Array of { stdName, divName, subjectName, subjectCode }
  const teacherWorkloadMap = useMemo(() => {
    const map: Record<string, Array<{ stdName: string; divName: string; subjectName: string; subjectCode: string }>> = {};

    allocations.forEach((alloc) => {
      if (!alloc.staffId) return;
      if (!map[alloc.staffId]) {
        map[alloc.staffId] = [];
      }
      map[alloc.staffId].push({
        stdName: alloc.division?.standard?.name || alloc.subject?.standard?.name || 'Class',
        divName: alloc.division?.name || 'A',
        subjectName: alloc.subject?.name || 'Subject',
        subjectCode: alloc.subject?.code || '',
      });
    });

    return map;
  }, [allocations]);

  // ================= HANDLERS FOR DEPARTMENTS & STANDARDS =================
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setErrorMsg(null);
    try {
      await api.post('/settings/department', { name: newDeptName.trim(), description: `${newDeptName.trim()} faculty wing` });
      setNewDeptName('');
      setSuccessMsg('Department added to PostgreSQL database successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to create department.');
    }
  };

  const handleUpdateDept = async (id: string) => {
    if (!editDeptName.trim()) return;
    setErrorMsg(null);
    try {
      await api.put(`/settings/department/${id}`, { name: editDeptName.trim(), description: editDeptDesc.trim() });
      setEditingDeptId(null);
      setSuccessMsg('Department updated successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to update department.');
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this department?')) return;
    setErrorMsg(null);
    try {
      await api.delete(`/settings/department/${id}`);
      setSuccessMsg('Department removed successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to delete department.');
    }
  };

  const handleCreateStd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStdName.trim()) return;
    setErrorMsg(null);
    try {
      await api.post('/settings/standard', { name: newStdName.trim(), level: parseInt(newStdLevel, 10) || 11, capacity: 60 });
      setNewStdName('');
      setSuccessMsg('Standard grade tier added to PostgreSQL database successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to create standard tier.');
    }
  };

  const handleUpdateStd = async (id: string) => {
    if (!editStdName.trim()) return;
    setErrorMsg(null);
    try {
      await api.put(`/settings/standard/${id}`, { name: editStdName.trim() });
      setEditingStdId(null);
      setSuccessMsg('Standard grade tier updated successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to update standard tier.');
    }
  };

  const handleDeleteStd = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this standard grade tier and all associated subjects?')) return;
    setErrorMsg(null);
    try {
      await api.delete(`/settings/standard/${id}`);
      setSuccessMsg('Standard removed successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to delete standard tier.');
    }
  };

  const handleCreateDiv = async (standardId: string) => {
    if (!newDivName.trim()) return;
    setErrorMsg(null);
    try {
      await api.post('/settings/division', { standardId, name: newDivName.trim(), roomNumber: newDivRoom.trim() || 'Room 101' });
      setAddingDivStdId(null);
      setNewDivName('');
      setNewDivRoom('');
      setSuccessMsg('Division added successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to add division.');
    }
  };

  const handleUpdateDiv = async (id: string) => {
    if (!editDivName.trim()) return;
    setErrorMsg(null);
    try {
      await api.put(`/settings/division/${id}`, { name: editDivName.trim(), roomNumber: editDivRoom.trim() });
      setEditingDivId(null);
      setSuccessMsg('Division updated successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to update division.');
    }
  };

  const handleDeleteDiv = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this division section?')) return;
    setErrorMsg(null);
    try {
      await api.delete(`/settings/division/${id}`);
      setSuccessMsg('Division removed successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to delete division.');
    }
  };

  // ================= HANDLERS FOR SUBJECTS =================
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubStdId) {
      setErrorMsg('Subject name and standard are required.');
      return;
    }
    setErrorMsg(null);
    try {
      await SettingsService.createSubject({
        standardId: newSubStdId,
        name: newSubName.trim(),
        code: newSubCode.trim() || undefined,
        isOptional: newSubIsOptional,
      });
      setIsAddSubjectModalOpen(false);
      setNewSubName('');
      setNewSubCode('');
      setNewSubIsOptional(false);
      setSuccessMsg('Subject added to standard curriculum successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to create subject.');
    }
  };

  const handleOpenEditSubject = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setEditSubName(sub.name);
    setEditSubCode(sub.code);
    setEditSubStdId(sub.standardId);
    setEditSubIsOptional(sub.isOptional);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editSubName.trim()) return;
    setErrorMsg(null);
    try {
      await SettingsService.updateSubject(editingSubject.id, {
        name: editSubName.trim(),
        code: editSubCode.trim(),
        standardId: editSubStdId,
        isOptional: editSubIsOptional,
      });
      setEditingSubject(null);
      setSuccessMsg('Subject details updated successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to update subject.');
    }
  };

  const handleDeleteSubject = async (sub: SubjectItem) => {
    if (!window.confirm(`Are you sure you want to remove '${sub.name}' (${sub.code}) and all its class teacher assignments?`)) return;
    setErrorMsg(null);
    try {
      await SettingsService.deleteSubject(sub.id);
      setSuccessMsg(`Subject '${sub.name}' removed from curriculum.`);
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to delete subject.');
    }
  };

  // ================= HANDLERS FOR TEACHER ALLOCATION =================
  const handleTeacherSelect = (subjectId: string, staffId: string) => {
    setClassSubjectAssignments((prev) => {
      const next = { ...prev };
      if (!staffId) {
        delete next[subjectId];
      } else {
        next[subjectId] = staffId;
      }
      return next;
    });
  };

  const handleSaveClassAllocations = async () => {
    if (!selectedAllocDivId) {
      setErrorMsg('Please select a valid class division.');
      return;
    }
    setSavingAllocations(true);
    setErrorMsg(null);

    const assignmentsPayload = Object.entries(classSubjectAssignments).map(([subjectId, staffId]) => ({
      subjectId,
      staffId,
    }));

    try {
      const res = await SettingsService.bulkSaveClassSubjectAssignments(selectedAllocDivId, assignmentsPayload);
      setSuccessMsg(res.message || 'Class teacher allocations saved successfully!');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to save class teacher allocations.');
    } finally {
      setSavingAllocations(false);
    }
  };

  const handleDeleteAllocation = async (allocId: string) => {
    if (!window.confirm('Remove this teacher from this subject in this class?')) return;
    try {
      await SettingsService.deleteSubjectAllocation(allocId);
      setSuccessMsg('Teacher allocation removed.');
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to remove allocation.');
    }
  };

  // Filtered Subjects for Subject Tab
  const filteredSubjects = useMemo(() => {
    let list: SubjectItem[] = data.subjects || [];

    if (subjectFilterStdId !== 'ALL') {
      list = list.filter((s) => s.standardId === subjectFilterStdId);
    }

    if (subjectSearch.trim()) {
      const q = subjectSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.standard?.name.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data.subjects, subjectFilterStdId, subjectSearch]);

  // Active Standard & Subjects for the selected class in Allocation Tab
  const activeAllocationStandard = useMemo(() => {
    return data.standards?.find((s: any) => s.id === selectedAllocStdId) || null;
  }, [data.standards, selectedAllocStdId]);

  const activeAllocationDivision = useMemo(() => {
    if (!activeAllocationStandard) return null;
    return activeAllocationStandard.divisions?.find((d: any) => d.id === selectedAllocDivId) || null;
  }, [activeAllocationStandard, selectedAllocDivId]);

  const activeAllocationSubjects = useMemo(() => {
    if (!activeAllocationStandard) return [];
    return activeAllocationStandard.subjects || [];
  }, [activeAllocationStandard]);

  if (loading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-primary-600 text-white rounded-xl shadow-xs">
              <School className="w-5 h-5" />
            </div>
            {t('settings_header_title')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t('settings_header_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary-50 border border-primary-200 text-primary-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            GSEB Affiliated · Est. 1959 Bhavnagar
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200 shadow-xs animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 text-red-800 text-xs font-semibold flex items-center gap-2 border border-red-200 shadow-xs animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'general' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          {t('general_tab')}
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'departments' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          {t('departments_tab').replace('{{count}}', data.departments?.length?.toString() || '0')}
        </button>

        <button
          onClick={() => setActiveTab('standards')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'standards' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          {t('standards_tab').replace('{{count}}', data.standards?.length?.toString() || '0')}
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'subjects' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {t('subjects_tab', { count: data.subjects?.length || 0 })}
        </button>

        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'allocations' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          {t('allocations_tab')}
          <span className="px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-[10px] font-extrabold">
            {allocations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'backup' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Database Backup
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
        
        {/* TAB 1: GENERAL IDENTITY */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">{t('core_identity_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {data.settings?.map((s: any, i: number) => (
                <div key={i} className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{s.description || s.key}</label>
                  <input
                    type="text"
                    defaultValue={s.value}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary-500 bg-slate-50"
                  />
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => { setSuccessMsg('General institutional identity parameters saved!'); setTimeout(() => setSuccessMsg(null), 3000); }}
                className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition shadow-md shadow-primary-600/20"
              >
                {t('save_params_btn')}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DEPARTMENTS */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">{t('wings_title')}</h3>
              <form onSubmit={handleCreateDept} className="flex gap-2">
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="New Department Title..."
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> {t('add_dept_btn')}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.departments?.map((d: any) => (
                <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3">
                  {editingDeptId === d.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editDeptName}
                        onChange={(e) => setEditDeptName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={editDeptDesc}
                        onChange={(e) => setEditDeptDesc(e.target.value)}
                        placeholder="Description..."
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => setEditingDeptId(null)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">Cancel</button>
                        <button onClick={() => handleUpdateDept(d.id)} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-xs font-bold">Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{d.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{d.description || 'Faculty wing'}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-extrabold text-xs text-primary-700 shadow-xs flex-shrink-0">
                          {d._count?.staffMembers || 0} Staff
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                        <button
                          onClick={() => { setEditingDeptId(d.id); setEditDeptName(d.name); setEditDeptDesc(d.description || ''); }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDept(d.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" /> Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STANDARDS & DIVISIONS */}
        {activeTab === 'standards' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">{t('standards_divisions_title')}</h3>
              <form onSubmit={handleCreateStd} className="flex gap-2">
                <input
                  type="text"
                  value={newStdName}
                  onChange={(e) => setNewStdName(e.target.value)}
                  placeholder="e.g. Standard 11 Commerce"
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select value={newStdLevel} onChange={(e) => setNewStdLevel(e.target.value)} className="p-2 border border-slate-300 rounded-xl text-xs bg-white">
                  <option value="9">Level 9</option>
                  <option value="10">Level 10</option>
                  <option value="11">Level 11</option>
                  <option value="12">Level 12</option>
                </select>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> {t('add_std_btn')}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              {data.standards?.map((s: any) => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    {editingStdId === s.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editStdName}
                          onChange={(e) => setEditStdName(e.target.value)}
                          className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                        <button onClick={() => handleUpdateStd(s.id)} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-xs font-bold">Save</button>
                        <button onClick={() => setEditingStdId(null)} className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <h4 className="font-extrabold text-slate-800 text-sm">{s.name} (Level {s.level})</h4>
                        <span className="px-2 py-0.5 rounded bg-primary-100 text-primary-800 text-[10px] font-extrabold">
                          {s.subjects?.length || 0} Subjects
                        </span>
                        <button onClick={() => { setEditingStdId(s.id); setEditStdName(s.name); }} className="text-slate-400 hover:text-primary-600 transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteStd(s.id)} className="text-slate-400 hover:text-red-600 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-400">{s.divisions?.length || 0} Divisions Active</span>
                  </div>

                  {/* Divisions list */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.divisions?.map((div: any) => (
                      <div key={div.id} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-2">
                        {editingDivId === div.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editDivName}
                              onChange={(e) => setEditDivName(e.target.value)}
                              className="w-10 p-1 border rounded text-xs font-bold"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={editDivRoom}
                              onChange={(e) => setEditDivRoom(e.target.value)}
                              className="w-20 p-1 border rounded text-xs"
                              placeholder="Room"
                            />
                            <button onClick={() => handleUpdateDiv(div.id)} className="p-1 bg-primary-600 text-white rounded"><Save className="w-3 h-3" /></button>
                            <button onClick={() => setEditingDivId(null)} className="p-1 bg-slate-200 text-slate-700 rounded"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <>
                            <span>Div {div.name} ({div.roomNumber || 'Room N/A'})</span>
                            <button onClick={() => { setEditingDivId(div.id); setEditDivName(div.name); setEditDivRoom(div.roomNumber || ''); }} className="text-slate-400 hover:text-primary-600">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDeleteDiv(div.id)} className="text-slate-400 hover:text-red-600">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}

                    {addingDivStdId === s.id ? (
                      <div className="flex items-center gap-1.5 p-1 bg-white border border-primary-300 rounded-lg">
                        <input
                          type="text"
                          value={newDivName}
                          onChange={(e) => setNewDivName(e.target.value)}
                          placeholder="Div Name (e.g. A)"
                          className="w-24 px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                        <input
                          type="text"
                          value={newDivRoom}
                          onChange={(e) => setNewDivRoom(e.target.value)}
                          placeholder="Room 101"
                          className="w-24 px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                        <button onClick={() => handleCreateDiv(s.id)} className="px-2.5 py-1 bg-primary-600 text-white rounded text-xs font-bold">Add</button>
                        <button onClick={() => setAddingDivStdId(null)} className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingDivStdId(s.id)}
                        className="px-3 py-1 rounded-lg border border-dashed border-primary-300 text-primary-600 font-semibold text-xs hover:bg-primary-50 transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> {t('add_div_btn')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SUBJECTS & CURRICULUM MANAGEMENT */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            
            {/* Header with Title & Add Subject Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  {t('manage_subjects_title')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('manage_subjects_subtitle')}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsAddSubjectModalOpen(true);
                  if (subjectFilterStdId !== 'ALL') setNewSubStdId(subjectFilterStdId);
                }}
                className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-primary-600/20"
              >
                <Plus className="w-4 h-4" />
                {t('add_subject_btn')}
              </button>
            </div>

            {/* Standard Filter Pills & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
                </span>
                <button
                  onClick={() => setSubjectFilterStdId('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition whitespace-nowrap ${
                    subjectFilterStdId === 'ALL'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Standards ({data.subjects?.length || 0})
                </button>
                {data.standards?.map((std: any) => (
                  <button
                    key={std.id}
                    onClick={() => setSubjectFilterStdId(std.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition whitespace-nowrap ${
                      subjectFilterStdId === std.id
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {std.name} ({std.subjects?.length || 0})
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Search subject or code..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Subjects Grid */}
            {filteredSubjects.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No subjects found</h4>
                <p className="text-xs text-slate-400 mt-1">Create a new standard subject to populate the curriculum matrix.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((sub: SubjectItem) => {
                  const assignedCount = sub.teacherMappings?.length || 0;
                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-soft transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-primary-50 text-primary-800 text-[11px] font-mono font-black border border-primary-200">
                            {sub.code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              sub.isOptional
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {sub.isOptional ? t('optional_elective') : t('compulsory_core')}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{sub.name}</h4>
                          <p className="text-xs font-semibold text-primary-700 mt-0.5 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-primary-500" />
                            {sub.standard?.name || 'Standard Curriculum'}
                          </p>
                        </div>

                        {/* Assigned Teacher summary */}
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          {assignedCount > 0 ? (
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                Assigned in {assignedCount} Class {assignedCount > 1 ? 'Divisions' : 'Division'}:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {sub.teacherMappings?.map((m) => (
                                  <span key={m.id} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                    Div {m.division?.name}: {m.staff?.firstName} {m.staff?.lastName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic flex items-center gap-1">
                              <Info className="w-3 h-3" /> No teacher assigned yet in classes
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenEditSubject(sub)}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition border border-slate-200"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(sub)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold flex items-center gap-1 transition border border-red-200"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TEACHER SUBJECT & CLASS ALLOCATION */}
        {activeTab === 'allocations' && (
          <div className="space-y-6">
            
            {/* Header with Title & Mode Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary-600" />
                  {t('teacher_allocations_title')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('teacher_allocations_subtitle')}
                </p>
              </div>

              {/* Toggle view: Class-wise vs Teacher-wise */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setAllocationViewMode('class')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                    allocationViewMode === 'class'
                      ? 'bg-white text-primary-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <School className="w-3.5 h-3.5" /> Class-Wise Allocation
                </button>
                <button
                  onClick={() => setAllocationViewMode('teacher')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                    allocationViewMode === 'teacher'
                      ? 'bg-white text-primary-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Teacher Workload View
                </button>
              </div>
            </div>

            {/* VIEW MODE 1: CLASS-WISE ALLOCATION */}
            {allocationViewMode === 'class' && (
              <div className="space-y-6">
                
                {/* Standard & Division Selection Banner */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        1. Select Standard Tier
                      </label>
                      <select
                        value={selectedAllocStdId}
                        onChange={(e) => setSelectedAllocStdId(e.target.value)}
                        className="p-2.5 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[200px]"
                      >
                        {data.standards?.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (Level {s.level})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        2. Select Class Division
                      </label>
                      <select
                        value={selectedAllocDivId}
                        onChange={(e) => setSelectedAllocDivId(e.target.value)}
                        className="p-2.5 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[180px]"
                      >
                        {activeAllocationStandard?.divisions?.length === 0 ? (
                          <option value="">No Divisions Configured</option>
                        ) : (
                          activeAllocationStandard?.divisions?.map((d: any) => (
                            <option key={d.id} value={d.id}>
                              Division {d.name} ({d.roomNumber || 'Room N/A'})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveClassAllocations}
                      disabled={savingAllocations || !selectedAllocDivId}
                      className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {savingAllocations ? 'Saving Allocations...' : t('save_class_allocations_btn')}
                    </button>
                  </div>
                </div>

                {/* Subjects Allocation Matrix for this Class */}
                {activeAllocationSubjects.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">No subjects configured for {activeAllocationStandard?.name || 'this standard'}</h4>
                    <p className="text-xs text-slate-400 mt-1">Please add subjects in the "Subjects & Curriculum" tab first.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs font-extrabold">
                      <span>
                        Subject Teacher Allocations: {activeAllocationStandard?.name} — Division {activeAllocationDivision?.name || 'A'}
                      </span>
                      <span className="text-amber-400 text-[11px]">
                        {Object.keys(classSubjectAssignments).length} of {activeAllocationSubjects.length} subjects assigned
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200 bg-white">
                      {activeAllocationSubjects.map((subject: any) => {
                        const currentStaffId = classSubjectAssignments[subject.id] || '';
                        const assignedTeacher = staffList.find((st) => st.id === currentStaffId);
                        const teacherWorkload = currentStaffId ? (teacherWorkloadMap[currentStaffId] || []) : [];
                        const otherClasses = teacherWorkload.filter(
                          (w) => !(w.divName === activeAllocationDivision?.name && w.stdName === activeAllocationStandard?.name && w.subjectCode === subject.code)
                        );

                        return (
                          <div key={subject.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                            <div className="space-y-1 min-w-[260px]">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-800 border border-primary-200">
                                  {subject.code}
                                </span>
                                <span className="font-extrabold text-sm text-slate-900">{subject.name}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-semibold block">
                                {subject.isOptional ? 'Optional / Elective Curriculum' : 'Compulsory Core Curriculum'}
                              </span>
                            </div>

                            {/* Assigned Teacher Selector */}
                            <div className="flex-1 max-w-lg space-y-1.5">
                              <select
                                value={currentStaffId}
                                onChange={(e) => handleTeacherSelect(subject.id, e.target.value)}
                                className={`w-full p-2.5 border rounded-xl text-xs font-bold cursor-pointer transition ${
                                  currentStaffId
                                    ? 'border-emerald-300 bg-emerald-50/30 text-slate-900 focus:ring-emerald-500'
                                    : 'border-slate-300 bg-white text-slate-500 focus:ring-primary-500'
                                }`}
                              >
                                <option value="">-- Assign Subject Teacher --</option>
                                {staffList.map((teacher: any) => {
                                  const count = teacherWorkloadMap[teacher.id]?.length || 0;
                                  return (
                                    <option key={teacher.id} value={teacher.id}>
                                      {teacher.firstName} {teacher.lastName} ({teacher.empId} · {teacher.department?.name || teacher.designation}) {count > 0 ? `— [Teaches ${count} other classes]` : ''}
                                    </option>
                                  );
                                })}
                              </select>

                              {/* Multi-standard lecture workload tag */}
                              {assignedTeacher && (
                                <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    {assignedTeacher.firstName} {assignedTeacher.lastName} ({assignedTeacher.empId})
                                  </span>
                                  {otherClasses.length > 0 ? (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                                      Also teaches: {otherClasses.map((c) => `${c.stdName} (${c.divName})`).slice(0, 3).join(', ')}
                                      {otherClasses.length > 3 ? ` +${otherClasses.length - 3} more` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">No other standard clashes</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Clear button */}
                            {currentStaffId && (
                              <button
                                type="button"
                                onClick={() => handleTeacherSelect(subject.id, '')}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                                title="Unassign teacher"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Assigned teachers will automatically populate in weekly timetable generation and schedule clash matrices.
                      </span>
                      <button
                        onClick={handleSaveClassAllocations}
                        disabled={savingAllocations || !selectedAllocDivId}
                        className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {savingAllocations ? 'Saving...' : t('save_class_allocations_btn')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE 2: TEACHER-WISE WORKLOAD VIEW */}
            {allocationViewMode === 'teacher' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 pb-2">
                  <span className="text-xs font-extrabold text-slate-700 uppercase">
                    Institutional Faculty Workload & Cross-Standard Assignments ({staffList.length} Teachers)
                  </span>
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={allocSearchTeacher}
                      onChange={(e) => setAllocSearchTeacher(e.target.value)}
                      placeholder="Search faculty name or ID..."
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffList
                    .filter((st) => {
                      if (!allocSearchTeacher.trim()) return true;
                      const q = allocSearchTeacher.toLowerCase();
                      return (
                        st.firstName.toLowerCase().includes(q) ||
                        st.lastName.toLowerCase().includes(q) ||
                        st.empId.toLowerCase().includes(q) ||
                        st.department?.name?.toLowerCase().includes(q)
                      );
                    })
                    .map((teacher) => {
                      const teacherAllocations = allocations.filter((a) => a.staffId === teacher.id);
                      return (
                        <div
                          key={teacher.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-soft transition space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm">
                                {teacher.firstName} {teacher.lastName}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {teacher.empId} · {teacher.department?.name || teacher.designation}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold shadow-2xs ${
                                teacherAllocations.length > 0
                                  ? 'bg-primary-50 text-primary-800 border border-primary-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {teacherAllocations.length} {teacherAllocations.length === 1 ? 'Class Subject' : 'Class Subjects'}
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400">
                              Assigned Standards & Classes:
                            </span>
                            {teacherAllocations.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No subject or class assigned yet.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {teacherAllocations.map((alloc) => (
                                  <div
                                    key={alloc.id}
                                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <span className="font-extrabold text-slate-800">
                                        {alloc.division?.standard?.name || 'Class'} (Div {alloc.division?.name})
                                      </span>
                                      <span className="text-slate-500 ml-1.5">
                                        — {alloc.subject?.name} ({alloc.subject?.code})
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteAllocation(alloc.id)}
                                      className="text-slate-400 hover:text-red-600 p-1"
                                      title="Remove allocation"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 6: BACKUP & DATABASE SNAPSHOT */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100 space-y-1">
              <h3 className="text-base font-bold text-slate-800">Single-School Administrative Database Snapshot & Backup</h3>
              <p className="text-xs text-slate-500">Download immediate JSON/SQL snapshots of all institutional ledgers, pupil profiles, staff records, subjects, and marks to local storage for offline preservation.</p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-amber-950 text-sm">Full Institutional Database Backup</h4>
                  <p className="text-xs text-amber-800">Includes Students, Staff, Subjects, Teacher Allocations, Timetable, Fee Receipts, and Settings for Academic Year 2026-2027.</p>
                </div>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ ...data, allocations }, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `DJMHS_ERP_Backup_${new Date().toISOString().split('T')[0]}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    setSuccessMsg('Database snapshot generated and downloaded successfully!');
                    setTimeout(() => setSuccessMsg(null), 4000);
                  }}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 flex-shrink-0"
                >
                  <Shield className="w-4 h-4" /> Download Complete Backup (.JSON)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL: ADD STANDARD SUBJECT ================= */}
      {isAddSubjectModalOpen && (
        <Modal
          isOpen={isAddSubjectModalOpen}
          onClose={() => setIsAddSubjectModalOpen(false)}
          title="Add New Standard Curriculum Subject"
          subtitle="Establish a new subject for GSEB High School or Higher Secondary Commerce curriculum."
          maxWidth="md"
        >
          <form onSubmit={handleCreateSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Target Standard Tier *</label>
              <select
                value={newSubStdId}
                onChange={(e) => setNewSubStdId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500"
                required
              >
                {data.standards?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Level {s.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Subject Title / Name *</label>
              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="e.g. Elements of Accounts, Statistics, Gujarati"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Subject Code (Optional)</label>
              <input
                type="text"
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                placeholder="e.g. ACC-11, STAT-11 (Auto-generated if blank)"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 uppercase"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="newSubIsOptional"
                checked={newSubIsOptional}
                onChange={(e) => setNewSubIsOptional(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="newSubIsOptional" className="text-xs font-bold text-slate-700 cursor-pointer">
                Optional / Elective Curriculum Subject (Non-Mandatory)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition"
              >
                Create Subject
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: EDIT STANDARD SUBJECT ================= */}
      {editingSubject && (
        <Modal
          isOpen={!!editingSubject}
          onClose={() => setEditingSubject(null)}
          title={`Edit Subject: ${editingSubject.name}`}
          subtitle="Modify subject name, curriculum code, or standard assignment."
          maxWidth="md"
        >
          <form onSubmit={handleUpdateSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Standard Tier</label>
              <select
                value={editSubStdId}
                onChange={(e) => setEditSubStdId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500"
              >
                {data.standards?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Level {s.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Subject Title / Name *</label>
              <input
                type="text"
                value={editSubName}
                onChange={(e) => setEditSubName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Subject Code</label>
              <input
                type="text"
                value={editSubCode}
                onChange={(e) => setEditSubCode(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 uppercase"
                required
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="editSubIsOptional"
                checked={editSubIsOptional}
                onChange={(e) => setEditSubIsOptional(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="editSubIsOptional" className="text-xs font-bold text-slate-700 cursor-pointer">
                Optional / Elective Curriculum Subject
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-md shadow-primary-600/30 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default SettingsPage;
