'use client';

import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, Download, Plus, Inbox } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchField?: (row: T) => string;
  filters?: FilterGroup[];
  onAddClick?: () => void;
  addLabel?: string;
  onExportClick?: () => void;
  pageSize?: number;
  emptyTitle?: string;
  emptySub?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchField,
  filters,
  onAddClick,
  addLabel = 'Add New',
  onExportClick,
  pageSize = 10,
  emptyTitle = 'No records found',
  emptySub = 'Try adjusting your search or filters to find what you are looking for.',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Search logic
  const filteredData = data.filter(row => {
    // Search match
    if (searchTerm.trim() !== '') {
      const searchTarget = searchField
        ? searchField(row)
        : Object.values(row as any).join(' ');
      if (!searchTarget.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    // Filters match
    for (const [key, val] of Object.entries(activeFilters)) {
      if (val && val !== 'ALL') {
        const rowVal = (row as any)[key];
        if (String(rowVal) !== String(val)) {
          return false;
        }
      }
    }

    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-erp overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        {/* Filter Dropdowns & Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
          {filters?.map(f => (
            <div key={f.key} className="relative">
              <select
                value={activeFilters[f.key] || 'ALL'}
                onChange={e => handleFilterChange(f.key, e.target.value)}
                className="pl-3 pr-8 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer"
              >
                <option value="ALL">All {f.label}s</option>
                {f.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          ))}

          {onExportClick && (
            <button
              onClick={onExportClick}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          )}

          {onAddClick && (
            <button
              onClick={onAddClick}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100/70 text-slate-700 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-slate-700 ${col.className || ''}`}>
                      {col.cell ? col.cell(row) : (row as any)[col.accessorKey as string]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
                      <Inbox className="h-8 w-8" />
                    </div>
                    <h4 className="text-base font-medium text-slate-800">{emptyTitle}</h4>
                    <p className="text-xs text-slate-500 mt-1">{emptySub}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 text-xs text-slate-600">
        <div>
          Showing <span className="font-semibold">{filteredData.length > 0 ? startIndex + 1 : 0}</span> to{' '}
          <span className="font-semibold">{Math.min(startIndex + pageSize, filteredData.length)}</span> of{' '}
          <span className="font-semibold">{filteredData.length}</span> records
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
