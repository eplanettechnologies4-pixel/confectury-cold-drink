'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertOctagon,
  Plus,
  CheckCircle2,
  Clock,
  RotateCcw,
  Banknote,
  Download,
  Building2,
  UserCheck,
  Search,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';
import { BadDebt, BadDebtRecovery } from '@/types';

export default function BadDebtsPage() {
  const {
    badDebts,
    requestBadDebt,
    approveBadDebt,
    badDebtRecoveries,
    recordBadDebtRecovery,
    clients,
    orders,
    currentUser,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'requests' | 'recoveries'>('requests');
  const [searchQuery, setSearchQuery] = useState('');

  // Request Bad Debt Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState('');
  const [writeOffAmount, setWriteOffAmount] = useState(0);
  const [writeOffReason, setWriteOffReason] = useState('Customer shop closed / business bankrupt');
  const [writeOffNotes, setWriteOffNotes] = useState('');

  // Recovery Modal State
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [selectedBadDebtId, setSelectedBadDebtId] = useState('');
  const [recoveryAmount, setRecoveryAmount] = useState(0);
  const [recoveryMethod, setRecoveryMethod] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [recoveryNotes, setRecoveryNotes] = useState('');

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Client's unpaid orders
  const clientUnpaidOrders = orders.filter(
    o => o.clientId === selectedClientId && (o.total || o.grandTotal) - (o.paidAmount || o.amountPaid || 0) > 0 && o.status !== 'Cancelled'
  );

  // Approved bad debt total
  const approvedBadDebtTotal = badDebts
    .filter(b => b.status === 'Approved')
    .reduce((acc, b) => acc + b.writeOffAmount, 0);

  const pendingBadDebtTotal = badDebts
    .filter(b => b.status === 'Pending')
    .reduce((acc, b) => acc + b.writeOffAmount, 0);

  const totalRecovered = badDebtRecoveries.reduce((acc, r) => acc + r.amount, 0);

  // Handle Request Bad Debt Submit
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || writeOffAmount <= 0) {
      alert('Write-off amount must be greater than zero');
      return;
    }
    if (writeOffAmount > selectedClient.currentBalance) {
      alert(
        `Cannot write off ${formatPKR(writeOffAmount)}. Customer's outstanding balance is only ${formatPKR(selectedClient.currentBalance)}.`
      );
      return;
    }

    requestBadDebt({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      invoiceReference: selectedInvoiceNumber || undefined,
      outstandingAmount: selectedClient.currentBalance,
      writeOffAmount,
      reason: writeOffReason,
      requestedBy: currentUser?.name || 'Administrator',
      notes: writeOffNotes,
    });

    setRequestModalOpen(false);
    setWriteOffAmount(0);
    setWriteOffNotes('');
  };

  // Handle Recovery Submit
  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bd = badDebts.find(b => b.id === selectedBadDebtId);
    if (!bd || recoveryAmount <= 0) return;

    recordBadDebtRecovery({
      badDebtId: bd.id,
      clientId: bd.clientId,
      clientName: bd.clientName,
      amount: recoveryAmount,
      date: getTodayKarachiDate(),
      paymentMethod: recoveryMethod,
      recordedBy: currentUser?.name || 'Administrator',
      notes: recoveryNotes || `Bad debt recovery against ${bd.badDebtNumber}`,
    });

    setRecoveryModalOpen(false);
    setSelectedBadDebtId('');
    setRecoveryAmount(0);
    setRecoveryNotes('');
  };

  const filteredBadDebts = badDebts.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.clientName.toLowerCase().includes(q) || b.badDebtNumber.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bad Debts & Receivable Recovery</h1>
          <p className="text-xs text-slate-500 mt-1">
            Formal write-off workflow for unrecoverable market debts and historical recovery tracking without deleting invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (selectedClient) setWriteOffAmount(Math.min(5000, selectedClient.currentBalance));
              setRequestModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Request Write-Off</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">Approved Bad Debts (Loss)</span>
            <AlertOctagon className="h-5 w-5 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-950 mt-2">{formatPKR(approvedBadDebtTotal)}</p>
          <p className="text-xs text-rose-700 mt-1">Written off against financial profit & loss</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Pending Review</span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-2">{formatPKR(pendingBadDebtTotal)}</p>
          <p className="text-xs text-amber-700 mt-1">Awaiting management approval</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Bad Debt Recoveries</span>
            <RotateCcw className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-950 mt-2">{formatPKR(totalRecovered)}</p>
          <p className="text-xs text-emerald-700 mt-1">Subsequent collections from written-off debt</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'requests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Write-Off Vouchers ({badDebts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('recoveries')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'recoveries'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Historical Recoveries ({badDebtRecoveries.length})</span>
        </button>
      </div>

      {/* TAB 1: WRITE-OFF VOUCHERS TABLE */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Voucher # & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Outstanding at Request</th>
                  <th className="py-3 px-4">Write-off Amount</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Status & Approval</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBadDebts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No bad debt write-off records found.
                    </td>
                  </tr>
                ) : (
                  filteredBadDebts.map(bd => (
                    <tr key={bd.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{bd.badDebtNumber}</span>
                        <span className="text-[11px] text-slate-500">{formatDateDDMMYYYY(bd.approvalDate || bd.date || '2026-10-01')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/clients/${bd.clientId}/ledger`} className="font-bold text-slate-900 hover:text-indigo-600 block">
                          {bd.clientName}
                        </Link>
                        {(bd.invoiceReference || bd.invoiceNumber) && (
                          <span className="font-mono text-[10px] text-slate-400">Inv: {bd.invoiceReference || bd.invoiceNumber}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatPKR(bd.outstandingAmount)}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">{formatPKR(bd.writeOffAmount)}</td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        <span className="font-semibold text-slate-800 block">{bd.reason}</span>
                        {bd.notes && <span className="text-[10px] text-slate-400 italic block">{bd.notes}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{bd.requestedBy}</td>
                      <td className="py-3 px-4">
                        {bd.status === 'Approved' ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block">
                              Approved
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">By: {bd.approvedBy}</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {bd.status === 'Pending' ? (
                          <button
                            onClick={() => approveBadDebt(bd.id, currentUser?.name || 'Administrator')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs transition"
                          >
                            Approve Write-off
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBadDebtId(bd.id);
                              setRecoveryAmount(bd.writeOffAmount);
                              setRecoveryModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-xs transition"
                          >
                            Record Recovery
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECOVERIES TABLE */}
      {activeTab === 'recoveries' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Recovery Ref #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount Recovered</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {badDebtRecoveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No bad debt recovery records logged yet.
                    </td>
                  </tr>
                ) : (
                  badDebtRecoveries.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.recoveryNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDateDDMMYYYY(rec.date)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{rec.clientName}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatPKR(rec.amount)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {rec.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{rec.recordedBy}</td>
                      <td className="py-3 px-4 text-slate-500 italic">{rec.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUEST BAD DEBT MODAL */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900">Request Bad Debt Write-Off</h2>
            <p className="text-xs text-slate-500 mt-1">
              Follows authorized protocol: upon approval, receivable reduces and financial bad debt expense is logged.
            </p>

            <form onSubmit={handleRequestSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer / Party *</label>
                <select
                  value={selectedClientId}
                  onChange={e => {
                    setSelectedClientId(e.target.value);
                    const cl = clients.find(c => c.id === e.target.value);
                    if (cl) setWriteOffAmount(cl.currentBalance);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Outstanding: {formatPKR(c.currentBalance)} ({c.area || 'Madina Town'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Outstanding Balance:</span>
                    <span className="font-extrabold text-rose-600">{formatPKR(selectedClient.currentBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Area / Route:</span>
                    <span className="text-slate-700">{selectedClient.area || 'Madina Town'}</span>
                  </div>
                </div>
              )}

              {clientUnpaidOrders.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Specific Invoice (Optional)</label>
                  <select
                    value={selectedInvoiceNumber}
                    onChange={e => setSelectedInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">General Balance Write-off</option>
                    {clientUnpaidOrders.map(o => (
                      <option key={o.id} value={o.orderNumber}>
                        {o.orderNumber} ({formatDateDDMMYYYY(o.date || o.orderDate)}) — Balance: {formatPKR((o.total || o.grandTotal) - (o.paidAmount || o.amountPaid || 0))}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Write-Off Amount (PKR) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedClient?.currentBalance || 999999}
                  value={writeOffAmount}
                  onChange={e => setWriteOffAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Bad Debt *</label>
                <select
                  value={writeOffReason}
                  onChange={e => setWriteOffReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Customer shop closed / business bankrupt">Customer shop closed / business bankrupt</option>
                  <option value="Retailer untraceable / relocated">Retailer untraceable / relocated</option>
                  <option value="Disputed invoice settlement write-off">Disputed invoice settlement write-off</option>
                  <option value="Deceased owner / liquidation">Deceased owner / liquidation</option>
                  <option value="Other unrecoverable credit">Other unrecoverable credit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Investigation Notes</label>
                <textarea
                  rows={2}
                  placeholder="Details of field visits by salesperson or recovery attempts"
                  value={writeOffNotes}
                  onChange={e => setWriteOffNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD BAD DEBT RECOVERY MODAL */}
      {recoveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900">Record Bad Debt Recovery</h2>
            <p className="text-xs text-slate-500 mt-1">
              Customer has made a partial or full payment on a previously written-off debt.
            </p>

            <form onSubmit={handleRecoverySubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recovered Amount (PKR) *</label>
                <input
                  type="number"
                  min="1"
                  value={recoveryAmount}
                  onChange={e => setRecoveryAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={recoveryMethod}
                  onChange={e => setRecoveryMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Cash">Cash Receipt</option>
                  <option value="Bank">Bank Deposit</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recovery Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash by new tenant of shop"
                  value={recoveryNotes}
                  onChange={e => setRecoveryNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecoveryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Post Bad Debt Recovery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
