'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Banknote, Receipt, Plus, Search, Building2, CheckCircle2 } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Payment } from '@/types';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';

export default function PaymentsHistoryPage() {
  const { payments, clients, recordPayment, currentUser } = useAppState();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const cashCollected = payments
    .filter(p => p.method === 'Cash' || (p as any).paymentMethod === 'Cash')
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const bankCollected = payments
    .filter(p => p.method === 'Bank' || (p as any).paymentMethod === 'Bank' || (p as any).paymentMethod === 'Bank Transfer')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const columns: Column<Payment>[] = [
    {
      header: 'Receipt # & Date',
      cell: (p) => (
        <div>
          <span className="font-mono font-bold text-emerald-600 block">{p.paymentNumber}</span>
          <span className="text-[11px] text-slate-500">{formatDateDDMMYYYY(p.date || (p as any).paymentDate)}</span>
        </div>
      ),
    },
    {
      header: 'Customer / Party',
      cell: (p) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{p.clientName}</span>
          {p.clientId && (
            <Link href={`/clients/${p.clientId}/ledger`} className="text-[10px] text-indigo-600 hover:underline">
              View Statement
            </Link>
          )}
        </div>
      ),
    },
    {
      header: 'Payment Method',
      cell: (p) => {
        const m = p.method || (p as any).paymentMethod || 'Cash';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            m === 'Cash' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {m}
          </span>
        );
      },
    },
    {
      header: 'Reference / Invoice Allocation',
      cell: (p) => (
        <span className="font-mono text-xs text-slate-700">
          {p.reference || (p as any).referenceNumber || p.orderId || 'Direct Collection'}
        </span>
      ),
    },
    {
      header: 'Amount Collected',
      cell: (p) => (
        <span className="font-extrabold text-emerald-600 text-xs">
          {formatPKR(p.amount)}
        </span>
      ),
    },
    {
      header: 'Recorded By',
      cell: (p) => <span className="text-xs text-slate-600">{(p as any).recordedBy || currentUser?.name || 'Administrator'}</span>,
    },
    {
      header: 'Status',
      cell: (p) => <StatusBadge status={p.status || 'Received'} />,
    },
  ];

  const handleExportCSV = () => {
    const headers = 'Receipt #,Date,Customer,Method,Reference,Amount,Recorded By,Status\n';
    const rows = payments
      .map(
        p =>
          `"${p.paymentNumber}","${p.date || (p as any).paymentDate}","${p.clientName.replace(/"/g, '""')}","${p.method || (p as any).paymentMethod || 'Cash'}","${p.reference || (p as any).referenceNumber || ''}",${p.amount},"${(p as any).recordedBy || 'Administrator'}","${p.status || 'Received'}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Collections_${getTodayKarachiDate()}.csv`;
    a.click();
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || amount <= 0) return;

    recordPayment({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      amount,
      paymentDate: getTodayKarachiDate(),
      paymentMethod: method as any,
      referenceNumber: reference || `REC-${Date.now().toString().slice(-4)}`,
      notes: notes || `Direct recovery payment`,
      recordedBy: currentUser?.name || 'Administrator',
    });

    setModalOpen(false);
    setAmount(0);
    setReference('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/clients" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Collections & Receipts</h1>
            <p className="text-xs text-slate-500">
              Recoveries collected from market retail parties. Reduces customer receivable without inflating sales.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              if (selectedClient) setAmount(selectedClient.currentBalance);
              setModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Record Collection</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">Total Collections</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{formatPKR(totalCollected)}</span>
          <span className="text-[11px] text-emerald-600 font-medium">{payments.length} receipts processed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Cash In Hand</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{formatPKR(cashCollected)}</span>
          <span className="text-[11px] text-slate-500">Collected in van/counter cash</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Bank / Online Transfers</span>
          <span className="text-2xl font-extrabold text-indigo-700 mt-1 block">{formatPKR(bankCollected)}</span>
          <span className="text-[11px] text-slate-500">Direct business bank credits</span>
        </div>
      </div>

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={payments}
        searchPlaceholder="Search receipt #, client name, or reference..."
        searchField={(p) => `${p.paymentNumber} ${p.clientName} ${p.reference || ''}`}
      />

      {/* RECORD COLLECTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900">Record Customer Collection Receipt</h2>
            <p className="text-xs text-slate-500 mt-1">
              Receipt will credit the customer&apos;s ledger and decrease total market receivables.
            </p>

            <form onSubmit={handleCreateCollection} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer / Party *</label>
                <select
                  value={selectedClientId}
                  onChange={e => {
                    setSelectedClientId(e.target.value);
                    const cl = clients.find(c => c.id === e.target.value);
                    if (cl) setAmount(cl.currentBalance);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Balance: {formatPKR(c.currentBalance)} ({c.area || 'Madina Town'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                  <span className="text-slate-500">Current Outstanding:</span>
                  <span className="font-extrabold text-rose-600">{formatPKR(selectedClient.currentBalance)}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Amount (PKR) *</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={method}
                    onChange={e => setMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Cash">Cash Receipt</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Slip No</label>
                  <input
                    type="text"
                    placeholder="e.g. SLIP-8821"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Collected on van route by delivery salesperson"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
