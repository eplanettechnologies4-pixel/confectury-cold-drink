'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Save,
  CheckCircle,
  FileSpreadsheet,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DailyClosingItem } from '@/types';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

export default function DailyClosingStockPage() {
  const {
    getDailyClosingForDate,
    saveDailyClosingCount,
    closeBusinessDay,
    reopenBusinessDay,
    currentUser,
  } = useAppState();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayKarachiDate());
  const [isReopenModalOpen, setIsReopenModalOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const closingData = getDailyClosingForDate(selectedDate);
  const [editableItems, setEditableItems] = useState<DailyClosingItem[]>(closingData.items);

  // Synchronize when date changes
  React.useEffect(() => {
    const data = getDailyClosingForDate(selectedDate);
    setEditableItems(data.items);
  }, [selectedDate]);

  const handlePhysicalCountChange = (productId: string, val: number) => {
    setEditableItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const physical = isNaN(val) ? 0 : val;
          return {
            ...item,
            physicalCount: physical,
            variance: physical - item.expectedClosing,
          };
        }
        return item;
      })
    );
  };

  const handleReasonChange = (productId: string, reason: string) => {
    setEditableItems(prev =>
      prev.map(item => (item.productId === productId ? { ...item, reason } : item))
    );
  };

  const handleSaveCounts = () => {
    saveDailyClosingCount(selectedDate, editableItems);
    setSuccessMessage('Physical counts saved successfully.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCloseDay = () => {
    // Validate reasons for any non-zero variances
    const unreasoned = editableItems.filter(i => i.variance !== 0 && !i.reason?.trim());
    if (unreasoned.length > 0) {
      alert(
        `Variance reason is required for: ${unreasoned.map(u => u.productName).join(', ')}`
      );
      return;
    }

    if (
      confirm(
        `Are you sure you want to officially CLOSE the business day for ${formatDateDDMMYYYY(
          selectedDate
        )}? Normal users will no longer be able to modify historical transactions for this day.`
      )
    ) {
      closeBusinessDay(selectedDate, currentUser?.name || 'Administrator');
      setSuccessMessage(`Day ${formatDateDDMMYYYY(selectedDate)} officially CLOSED.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleReopenDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;

    reopenBusinessDay(selectedDate, currentUser?.name || 'Administrator', reopenReason);
    setIsReopenModalOpen(false);
    setReopenReason('');
    setSuccessMessage(`Day ${formatDateDDMMYYYY(selectedDate)} REOPENED with audit trail.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const totalExpected = editableItems.reduce((sum, i) => sum + i.expectedClosing, 0);
  const totalPhysical = editableItems.reduce((sum, i) => sum + (i.physicalCount || 0), 0);
  const totalVariance = totalPhysical - totalExpected;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <CalendarCheck className="h-5 w-5 mr-2 text-brand-600" /> Daily Closing Stock & Physical Reconciliation
          </h1>
          <p className="text-xs text-slate-500">
            Formula: Opening + Purchases + Returns - Sales - Damage - Expired = Expected Closing. Reconcile with physical stock count.
          </p>
        </div>

        {/* Date Selector & Status Indicator */}
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
          />

          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center ${
              closingData.status === 'CLOSED'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : closingData.status === 'RECONCILIATION'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {closingData.status === 'CLOSED' ? (
              <Lock className="h-3.5 w-3.5 mr-1" />
            ) : (
              <Unlock className="h-3.5 w-3.5 mr-1" />
            )}
            Status: {closingData.status}
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Audit trail alert if day was reopened or closed */}
      {closingData.status === 'CLOSED' && (
        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-bold flex items-center text-rose-400">
              <Lock className="h-4 w-4 mr-1.5" /> This business day is officially CLOSED.
            </p>
            <p className="text-slate-400 text-[11px]">
              Closed by {closingData.closedBy || 'Admin'} at {closingData.closedAt ? new Date(closingData.closedAt).toLocaleTimeString() : 'N/A'}. Ordinary users cannot modify sales or inventory.
            </p>
          </div>

          <button
            onClick={() => setIsReopenModalOpen(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>Reopen Day (Authorized)</span>
          </button>
        </div>
      )}

      {closingData.reopenedBy && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center space-x-2">
          <History className="h-4 w-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Reopened Audit Note:</strong> Reopened by {closingData.reopenedBy} — Reason: "{closingData.reopenReason}"
          </span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total System Expected</span>
          <span className="text-2xl font-black font-mono text-slate-900">{totalExpected.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Calculated ledger balance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Physical Counted</span>
          <span className="text-2xl font-black font-mono text-emerald-700">{totalPhysical.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Physical warehouse count</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-erp ${totalVariance === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Variance</span>
          <span className={`text-2xl font-black font-mono ${totalVariance === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {totalVariance > 0 ? `+${totalVariance}` : totalVariance}
          </span>
          <span className="text-[10px] text-slate-600 block mt-0.5">
            {totalVariance === 0 ? 'Perfect match' : 'Requires audit reason'}
          </span>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-erp overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">
            Closing Stock Breakdown — {formatDateDDMMYYYY(selectedDate)}
          </h3>

          <div className="flex space-x-2">
            <button
              onClick={handleSaveCounts}
              disabled={closingData.status === 'CLOSED'}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Physical Counts</span>
            </button>

            {closingData.status !== 'CLOSED' && (
              <button
                onClick={handleCloseDay}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Finalize & Close Day</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-2">Category</th>
                <th className="py-2.5 px-2 text-right">Opening</th>
                <th className="py-2.5 px-2 text-right text-emerald-700">+Purchases</th>
                <th className="py-2.5 px-2 text-right text-rose-700">-Sales</th>
                <th className="py-2.5 px-2 text-right text-emerald-700">+Sales Ret</th>
                <th className="py-2.5 px-2 text-right text-rose-700">-Pur Ret</th>
                <th className="py-2.5 px-2 text-right text-rose-700">-Expired</th>
                <th className="py-2.5 px-2 text-right text-rose-700">-Damaged</th>
                <th className="py-2.5 px-2 text-right font-bold bg-slate-100">Expected</th>
                <th className="py-2.5 px-3 text-right bg-brand-50/50">Physical Count</th>
                <th className="py-2.5 px-2 text-right">Variance</th>
                <th className="py-2.5 px-3">Variance Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {editableItems.map(item => {
                const hasVariance = item.variance !== 0;

                return (
                  <tr key={item.productId} className={`hover:bg-slate-50 ${hasVariance ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {item.productName}
                      <span className="block text-[10px] text-slate-400 font-mono">{item.unit}</span>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.category === 'Confectionery' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700">{item.openingStock}</td>
                    <td className="py-2 px-2 text-right font-mono font-semibold text-emerald-700">+{item.purchases}</td>
                    <td className="py-2 px-2 text-right font-mono font-semibold text-rose-700">-{item.sales}</td>
                    <td className="py-2 px-2 text-right font-mono text-emerald-600">+{item.salesReturns}</td>
                    <td className="py-2 px-2 text-right font-mono text-rose-600">-{item.purchaseReturns}</td>
                    <td className="py-2 px-2 text-right font-mono text-rose-600">-{item.expired}</td>
                    <td className="py-2 px-2 text-right font-mono text-rose-600">-{item.damaged}</td>
                    <td className="py-2 px-2 text-right font-mono font-black text-slate-900 bg-slate-100/80">
                      {item.expectedClosing}
                    </td>
                    <td className="py-2 px-3 text-right bg-brand-50/50">
                      <input
                        type="number"
                        disabled={closingData.status === 'CLOSED'}
                        value={item.physicalCount}
                        onChange={e => handlePhysicalCountChange(item.productId, Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-black text-right text-xs focus:ring-1 focus:ring-brand-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-black">
                      <span className={item.variance === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {item.variance > 0 ? `+${item.variance}` : item.variance}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {hasVariance ? (
                        <select
                          disabled={closingData.status === 'CLOSED'}
                          value={item.reason || ''}
                          onChange={e => handleReasonChange(item.productId, e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-[11px] font-medium text-amber-900"
                        >
                          <option value="">Select Reason *</option>
                          <option value="Damaged goods">Damaged goods</option>
                          <option value="Breakage in warehouse">Breakage in warehouse</option>
                          <option value="Missing stock">Missing stock</option>
                          <option value="Counting error">Counting error</option>
                          <option value="Other">Other authorized variance</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No variance</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reopen Day Modal */}
      {isReopenModalOpen && (
        <Modal
          isOpen={isReopenModalOpen}
          onClose={() => setIsReopenModalOpen(false)}
          title={`Reopen Business Day: ${formatDateDDMMYYYY(selectedDate)}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleReopenDay} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
              <span className="font-bold flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-700" /> Authorized Day Reopening
              </span>
              <p className="text-[11px]">
                Reopening a closed business day permits financial corrections. An audit log entry will be permanently recorded with your name, timestamp, and explanation.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Reopening *</label>
              <textarea
                rows={3}
                placeholder="e.g. Correcting physical count error on Coca-Cola 330ml consignment"
                value={reopenReason}
                onChange={e => setReopenReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs"
              >
                Confirm & Reopen Day
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
