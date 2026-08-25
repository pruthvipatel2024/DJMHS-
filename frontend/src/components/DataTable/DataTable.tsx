import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Download, FileSpreadsheet, FileText, Filter, Trash2, Edit3, MoreHorizontal } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  sortKey?: keyof T;
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  filterComponent?: React.ReactNode;
}

function DataTable<T extends { id?: string }>({
  title,
  subtitle,
  data,
  columns,
  onEdit,
  onDelete,
  onRowClick,
  onExportExcel,
  onExportPDF,
  searchPlaceholder = 'Search institutional records...',
  actions,
  filterComponent,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    const key = (column.sortKey || column.accessor) as keyof T;
    if (typeof key !== 'string' && typeof key !== 'number') return;
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return Object.values(row as any).some((val) =>
        val ? String(val).toLowerCase().includes(term) : false
      );
    });
  }, [data, searchTerm]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
      
      {/* Top Controls Header */}
      <div className="p-3.5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div>
          {title && <h3 className="text-base sm:text-lg font-bold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-stretch sm:justify-end">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto flex-grow md:flex-grow-0 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>

          {/* Toggle Filter Panel */}
          {filterComponent && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              type="button"
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          )}

          {/* Export Actions */}
          {(onExportExcel || onExportPDF) && (
            <div className="flex items-center gap-1.5 border-l-0 sm:border-l sm:border-slate-200 sm:pl-2.5">
              {onExportExcel && (
                <button
                  onClick={onExportExcel}
                  type="button"
                  title="Export to Excel Spreadsheet"
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition flex items-center gap-1 text-xs font-semibold px-2.5 sm:px-3 border border-emerald-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              )}
              {onExportPDF && (
                <button
                  onClick={onExportPDF}
                  type="button"
                  title="Export to PDF Report"
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition flex items-center gap-1 text-xs font-semibold px-2.5 sm:px-3 border border-red-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              )}
            </div>
          )}

          {/* Additional Action Buttons (+ Add button) */}
          {actions}
        </div>
      </div>

      {/* Optional Expandable Filter Bar */}
      {showFilters && filterComponent && (
        <div className="px-3.5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-3 sm:gap-4 items-center animate-in fade-in duration-150">
          {filterComponent}
        </div>
      )}

      {/* Main Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(col)}
                  className={`py-3.5 px-4 select-none ${col.sortable ? 'cursor-pointer hover:bg-slate-100/80 transition text-slate-700' : ''} ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortColumn === (col.sortKey || col.accessor) && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary-600 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-primary-600 font-bold" />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && <th className="py-3.5 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">
                  No institutional records match your active search or filter criteria.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-primary-50/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIdx) => {
                    const value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
                    return (
                      <td key={colIdx} className={`py-3.5 px-4 text-slate-700 ${col.className || ''}`}>
                        {value as React.ReactNode}
                      </td>
                    );
                  })}
                  {(onEdit || onDelete) && (
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                            title="Edit Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete / Deactivate Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-semibold text-slate-700">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{' '}
          <span className="font-semibold text-slate-700">{sortedData.length}</span> total entries
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-slate-200 rounded-lg py-1 px-2 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Prev
            </button>
            <div className="px-3 py-1.5 rounded-lg bg-primary-600 text-white font-bold">
              {currentPage}
            </div>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
