import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building, Plus, CheckCircle2, Shield, AlertCircle, Edit2, Trash2, X, Save } from 'lucide-react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/States/LoadingSkeleton';
import { useTranslation } from 'react-i18next';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'standards' | 'backup'>('general');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    settings: [],
    departments: [],
    standards: [],
  });

  const [newDeptName, setNewDeptName] = useState('');
  const [newStdName, setNewStdName] = useState('');
  const [newStdLevel, setNewStdLevel] = useState('11');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.data) setData(res.data.data);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Unable to load institutional parameters from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
    if (!window.confirm('Are you sure you want to remove this standard grade tier?')) return;
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

  if (loading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-primary-600" />
            {t('settings_header_title')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t('settings_header_subtitle')}</p>
        </div>
        <span className="px-3 py-1 bg-primary-50 border border-primary-200 text-primary-700 font-bold text-xs rounded-xl">
          Est. 1959 Bhavnagar
        </span>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px ${
            activeTab === 'general' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('general_tab')}
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px ${
            activeTab === 'departments' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('departments_tab').replace('{{count}}', data.departments.length.toString())}
        </button>
        <button
          onClick={() => setActiveTab('standards')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px ${
            activeTab === 'standards' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('standards_tab').replace('{{count}}', data.standards.length.toString())}
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-5 py-3 font-bold text-xs border-b-2 transition -mb-px ${
            activeTab === 'backup' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Database Backup & Recovery
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
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

        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100 space-y-1">
              <h3 className="text-base font-bold text-slate-800">Single-School Administrative Database Snapshot & Backup</h3>
              <p className="text-xs text-slate-500">Download immediate JSON/SQL snapshots of all institutional ledgers, pupil profiles, staff records, and marks to local storage for offline preservation.</p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-amber-950 text-sm">Full Institutional Database Backup</h4>
                  <p className="text-xs text-amber-800">Includes Students, Staff, Attendance, Fee Receipts, Marks, and Settings for Academic Year 2026-2027.</p>
                </div>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `DJMHS_ERP_Backup_${new Date().toISOString().split('T')[0]}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    setSuccessMsg('Database snapshot generated and downloaded successfully!');
                    setTimeout(() => setSuccessMsg(null), 4000);
                  }}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" /> Download Complete Backup (.JSON)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SettingsPage;
