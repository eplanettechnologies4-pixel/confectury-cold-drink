'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Banknote, Calendar, AlertTriangle, Download, Plus, Receipt } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Client } from '@/types';

export default function AccountsPage() {
  const { clients, payments, recordPayment } = useAppState();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [amount, setAmount] = useState(2500);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'Other'>('Bank Transfer');
  const [refNo, setRefNo] = useState('');

  const totalReceivables = clients.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  const columns: Column<Client>[] = [
    {
      header: 'Client / Company',
      accessorKey: 'companyName',
      cell: (c) => (
        <div>
          <Link href={`/clients/${c.id}`} className="font-bold text-slate-900 hover:text-brand-600 block">
            {c.companyName}
          </Link>
          <span className="text-[11px] text-slate-500">{c.name} • ID: {c.clientId}</span>
        </div>
      ),
    },
    {
      header: 'Payment Terms',
      cell: (c) => <span className="text-xs font-semibold text-slate-700">{c.paymentTerms}</span>,
    },
    {
      header: 'Credit Limit',
      cell: (c) => <span className="text-xs text-slate-600">Rs. {c.creditLimit.toLocaleString()}</span>,
    },
    {
      header: 'Total Purchases',
      cell: (c) => <span className="text-xs text-slate-700">Rs. {c.totalPurchases.toLocaleString()}</span>,
    },
    {
      header: 'Total Paid',
      cell: (c) => <span className="text-xs font-semibold text-emerald-600">Rs. {c.totalPaid.toLocaleString()}</span>,
    },
    {
      header: 'Receivable Balance',
      cell: (c) => (
        <span className={`text-xs font-extrabold ${c.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Rs. {c.currentBalance.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (c) => (
        <StatusBadge status={c.currentBalance > c.creditLimit ? 'Overdue' : c.currentBalance > 0 ? 'Partially Paid' : 'Paid'} />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (c) => (
        <button
          onClick={() => {
            setSelectedClientId(c.id);
            setAmount(c.currentBalance > 0 ? c.currentBalance : 1000);
            setIsPaymentModalOpen(true);
          }}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition"
        >
          Record Payment
        </button>
      ),
    },
  ];

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === selectedClientId);
    if (!client || amount <= 0) return;

    recordPayment({
      clientId: client.id,
      clientName: `${client.name} (${client.companyName})`,
      paymentDate: new Date().toISOString().split('T')[0],
      amount,
      paymentMethod,
      referenceNumber: refNo || `WT-${Math.floor(10000 + Math.random() * 90000)}`,
      recordedBy: 'Michael Chang',
    });

    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Accounts & Receivables</h1>
          <p className="text-xs text-slate-500 mt-1">
            Financial dashboard tracking customer credit, outstanding invoices, and payment receipts.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/accounts/payments"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Receipt className="h-4 w-4" />
            <span>Payments Log</span>
          </Link>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Banknote className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Receivables</span>
          <span className="text-2xl font-extrabold text-slate-900">Rs. {totalReceivables.toLocaleString()}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Collections</span>
          <span className="text-2xl font-extrabold text-emerald-600">Rs. {totalPaid.toLocaleString()}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Overdue Balance</span>
          <span className="text-2xl font-extrabold text-rose-600">Rs. 42,300</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Credit Lines</span>
          <span className="text-2xl font-extrabold text-brand-600">Rs. 185,000</span>
        </div>
      </div>

      {/* Receivables Table */}
      <DataTable
        columns={columns}
        data={clients}
        searchPlaceholder="Search client account receivables..."
        searchField={(c) => `${c.companyName} ${c.name} ${c.clientId}`}
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        subtitle="Post client payment to ledger and reduce outstanding balance"
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Client Account</label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName} (Outstanding: Rs. {c.currentBalance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Amount (Rs.)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="Bank Transfer">Bank Wire / Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reference # / Cheque #</label>
            <input
              type="text"
              placeholder="WT-99018"
              value={refNo}
              onChange={e => setRefNo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              Post Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
