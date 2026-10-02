'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Plus,
  Filter,
  Download,
  Calendar,
  Truck,
  Fuel,
  Wrench,
  Users,
  Building,
  Zap,
  Phone,
  Search,
  CheckCircle2,
  MapPin,
  TrendingDown,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';
import { Expense } from '@/types';

const INITIAL_CATEGORIES = [
  'Fuel',
  'Vehicle Maintenance',
  'Loading',
  'Unloading',
  'Labour',
  'Salaries',
  'Warehouse',
  'Electricity',
  'Rent',
  'Telephone',
  'Internet',
  'Delivery',
  'Transport',
  'Vehicle Repair',
  'Damaged Goods Handling',
  'Other',
];

export default function DailyExpensesPage() {
  const { expenses, addExpense, areas, currentUser } = useAppState();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // New Expense Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('Fuel');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [newPaidTo, setNewPaidTo] = useState('');
  const [newArea, setNewArea] = useState('All Areas');
  const [newReference, setNewReference] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const todayStr = getTodayKarachiDate();

  // Helper date filtering
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const filteredExpenses = expenses.filter(exp => {
    // Only posted expenses affect calculations
    if (exp.status !== 'Posted') return false;

    // Date filtering
    if (dateFilter === 'today' && exp.date !== todayStr) return false;
    if (dateFilter === 'week' && exp.date < startOfWeekStr) return false;
    if (dateFilter === 'month' && exp.date < startOfMonthStr) return false;
    if (dateFilter === 'custom') {
      if (customStartDate && exp.date < customStartDate) return false;
      if (customEndDate && exp.date > customEndDate) return false;
    }

    // Category filtering
    if (selectedCategory !== 'All' && exp.category !== selectedCategory) return false;

    // Area filtering
    if (selectedArea !== 'All' && exp.area !== selectedArea) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        exp.description.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q) ||
        exp.paidTo.toLowerCase().includes(q) ||
        (exp.reference && exp.reference.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const totalExpense = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Group by category for Category-wise breakdown
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  // Group by area for Area-wise breakdown
  const areaTotals: Record<string, number> = {};
  filteredExpenses.forEach(exp => {
    const areaName = exp.area || 'General / Warehouse';
    areaTotals[areaName] = (areaTotals[areaName] || 0) + exp.amount;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmount <= 0) {
      alert('Expense amount must be greater than zero');
      return;
    }

    addExpense({
      date: todayStr,
      category: newCategory,
      description: newDescription,
      amount: newAmount,
      paymentMethod: newPaymentMethod,
      paidTo: newPaidTo,
      area: newArea === 'All Areas' ? undefined : newArea,
      receiptReference: newReference,
      reference: newReference,
      notes: newNotes,
      recordedBy: currentUser?.name || 'Administrator',
      status: 'Posted',
    });

    setModalOpen(false);
    setNewDescription('');
    setNewAmount(0);
    setNewPaidTo('');
    setNewReference('');
    setNewNotes('');
  };

  const handleExportCSV = () => {
    const headers = 'Expense #,Date,Category,Description,Amount (PKR),Payment Method,Paid To,Area,Reference,Recorded By\n';
    const rows = filteredExpenses
      .map(
        e =>
          `"${e.expenseNumber}","${e.date}","${e.category}","${e.description.replace(/"/g, '""')}",${e.amount},"${e.paymentMethod}","${e.paidTo.replace(/"/g, '""')}","${e.area || 'General'}","${e.reference || ''}","${e.recordedBy}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Distribution_Expenses_${todayStr}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Distribution Daily Expenses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track fleet fuel, loading/unloading labour, warehouse upkeep, vehicle maintenance, and route costs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* Expense KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">Total Filtered Expenses</span>
            <TrendingDown className="h-5 w-5 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-950 mt-2">{formatPKR(totalExpense)}</p>
          <p className="text-xs text-rose-700 mt-1">{filteredExpenses.length} posted expense vouchers</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Distribution Fleet (Fuel & Maint)</span>
            <Fuel className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatPKR((categoryTotals['Fuel'] || 0) + (categoryTotals['Vehicle Maintenance'] || 0) + (categoryTotals['Vehicle Repair'] || 0))}
          </p>
          <p className="text-xs text-slate-500 mt-1">Van transit & maintenance</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Loading & Handling Labour</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatPKR((categoryTotals['Loading'] || 0) + (categoryTotals['Unloading'] || 0) + (categoryTotals['Labour'] || 0))}
          </p>
          <p className="text-xs text-slate-500 mt-1">Warehouse labour charges</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Warehouse & Utilities</span>
            <Building className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatPKR((categoryTotals['Rent'] || 0) + (categoryTotals['Electricity'] || 0) + (categoryTotals['Warehouse'] || 0))}
          </p>
          <p className="text-xs text-slate-500 mt-1">Tezab Mills facility overheads</p>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Period:</span>
          {[
            { id: 'today', label: "Today's Expenses" },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All History' },
            { id: 'custom', label: 'Custom Dates' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setDateFilter(p.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                dateFilter === p.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}

          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-2 ml-2">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            {INITIAL_CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Routes / Areas</option>
            {areas.map(a => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search expense description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Expense Voucher #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4">Route / Area</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No expense records found for this period.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{exp.expenseNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDateDDMMYYYY(exp.date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{exp.description}</td>
                    <td className="py-3 px-4 text-slate-700">{exp.paidTo}</td>
                    <td className="py-3 px-4">
                      {exp.area ? (
                        <span className="text-slate-700 flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{exp.area}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General Facility</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span>{exp.paymentMethod}</span>
                      {exp.reference && <span className="font-mono text-[10px] text-slate-400 block">{exp.reference}</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {formatPKR(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{exp.recordedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs text-slate-900">
                <td colSpan={7} className="py-3 px-4 text-right">
                  Total Operational Expenses:
                </td>
                <td className="py-3 px-4 text-right text-rose-600 font-extrabold">{formatPKR(totalExpense)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* RECORD NEW EXPENSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900">Record Distribution Expense Voucher</h2>
            <p className="text-xs text-slate-500 mt-1">
              Recorded operational expenses will be immediately recognized on the Daily Profit & Loss report.
            </p>

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {INITIAL_CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={newAmount}
                    onChange={e => setNewAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Particulars *</label>
                <input
                  type="text"
                  placeholder="e.g. Fuel for delivery van Suzuki Ravi (Madina Town route)"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Paid To (Vendor/Person) *</label>
                  <input
                    type="text"
                    placeholder="e.g. PSO Petrol Pump / Muhammad Ali"
                    value={newPaidTo}
                    onChange={e => setNewPaidTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Route / Area Assignment</label>
                  <select
                    value={newArea}
                    onChange={e => setNewArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="All Areas">General Warehouse Overhead</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.name}>
                        {a.name} Route
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={newPaymentMethod}
                    onChange={e => setNewPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Cash">Cash Voucher</option>
                    <option value="Bank">Bank Account</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt / Slip Number</label>
                  <input
                    type="text"
                    placeholder="e.g. REC-5521"
                    value={newReference}
                    onChange={e => setNewReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional internal remarks"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Post Expense Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
