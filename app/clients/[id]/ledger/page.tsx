'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Download,
  Banknote,
  Search,
  BookOpen,
  Globe,
  Calendar,
  Filter,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';

export default function ClientLedgerPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { clients, getLedgerForClient, recordPayment } = useAppState();

  const client = clients.find(c => c.id === clientId || c.clientId === clientId);
  const rawLedger = client ? getLedgerForClient(client.id) : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(1000);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'Other'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');

  if (!client) {
    return <div className="p-8 text-center text-slate-500">Client profile not found.</div>;
  }

  // Filtered ledger entries
  const filteredLedger = rawLedger.filter(entry => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      entry.reference.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.type.toLowerCase().includes(q)
    );
  });

  // Calculate Running Totals
  const totalDebit = rawLedger.reduce((acc, e) => acc + e.debit, 0);
  const totalCredit = rawLedger.reduce((acc, e) => acc + e.credit, 0);
  const openingBalance = client.openingBalance || 0;
  const currentBalance = client.currentBalance;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = 'Date,Reference,Type,Description,Debit (Rs.),Credit (Rs.),Balance (Rs.)\n';
    const rows = filteredLedger
      .map(e => `"${e.date}","${e.reference}","${e.type}","${e.description.replace(/"/g, '""')}",${e.debit},${e.credit},${e.balance}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_${(client.companyName || client.name).replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    recordPayment({
      clientId: client.id,
      clientName: `${client.name} (${client.companyName})`,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: paymentRef || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      recordedBy: 'Michael Chang',
    });

    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar - Screen Only */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center space-x-3">
          <Link href={`/clients/${client.id}`} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Account Ledger</h1>
            <p className="text-xs text-slate-500">
              Complete debits, credits, and running balance statement for <span className="font-bold text-slate-800">{client.companyName}</span> ({client.clientId})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Banknote className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Official Printable Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-erp print-card">
        {/* Printable Letterhead */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Ahmad Traders</h2>
              <p className="text-[11px] text-slate-500">Confectionery & Cold Drinks Distribution • Khuram Chowk, Faisalabad</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-bold text-slate-900">Statement Date: {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
            <p>Official Party Ledger Statement</p>
          </div>
        </div>

        {/* Client & Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Opening Balance</span>
            <span className="text-lg font-bold text-slate-800">Rs. {openingBalance.toLocaleString()}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Invoiced (Debit)</span>
            <span className="text-lg font-bold text-slate-900">Rs. {totalDebit.toLocaleString()}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Received (Credit)</span>
            <span className="text-lg font-bold text-emerald-600">Rs. {totalCredit.toLocaleString()}</span>
          </div>
          <div className="p-3.5 bg-brand-50 rounded-lg border border-brand-200">
            <span className="text-[10px] uppercase font-bold text-brand-600 block">Current Outstanding Balance</span>
            <span className="text-xl font-extrabold text-brand-700">Rs. {currentBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Table & Toolbar Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-erp overflow-hidden print-card">
        {/* Search Toolbar - Screen Only */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 no-print">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference # or invoice..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredLedger.length} ledger entries
          </span>
        </div>

        {/* Accounting Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Reference #</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Debit (Rs.)</th>
                <th className="py-3 px-4 text-right">Credit (Rs.)</th>
                <th className="py-3 px-4 text-right">Balance (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{entry.date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {entry.reference}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{entry.type}</td>
                  <td className="py-3 px-4 text-slate-600">{entry.description}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                    {entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">Rs. {entry.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={4} className="py-3 px-4 uppercase text-slate-600 text-[11px]">
                  Total Summary
                </td>
                <td className="py-3 px-4 text-right font-extrabold">Rs. {totalDebit.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-extrabold text-emerald-600">Rs. {totalCredit.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-extrabold text-brand-700">Rs. {currentBalance.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Client Payment"
        subtitle={`Receive payment for ${client.companyName}`}
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Amount (Rs.)</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={e => setPaymentAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
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
              <option value="Bank Transfer">Bank Transfer / Wire</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reference Number</label>
            <input
              type="text"
              placeholder="WT-991204"
              value={paymentRef}
              onChange={e => setPaymentRef(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              Post Payment to Ledger
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
