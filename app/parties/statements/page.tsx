'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  Download,
  Calendar,
  Building2,
  MapPin,
  Phone,
  Search,
  ArrowLeft,
  Banknote,
  FileSpreadsheet,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, BUSINESS_CONFIG } from '@/lib/utils';
import { Client, LedgerEntry } from '@/types';

export default function PartyStatementsPage() {
  const { clients, getLedgerForClient, areas } = useAppState();

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('All');

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const rawLedger: LedgerEntry[] = selectedClient ? getLedgerForClient(selectedClient.id) : [];

  // Filter ledger entries by date & type
  const filteredLedger = rawLedger.filter(entry => {
    if (startDate && entry.date < startDate) return false;
    if (endDate && entry.date > endDate) return false;
    if (filterType !== 'All' && entry.type !== filterType) return false;
    return true;
  });

  const totalDebit = filteredLedger.reduce((acc, e) => acc + (e.debit || 0), 0);
  const totalCredit = filteredLedger.reduce((acc, e) => acc + (e.credit || 0), 0);
  const closingBalance = selectedClient?.currentBalance || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!selectedClient) return;
    const headers = 'Date,Reference,Type,Description,Debit (PKR),Credit (PKR),Balance (PKR)\n';
    const rows = filteredLedger
      .map(
        e =>
          `"${e.date}","${e.reference}","${e.type}","${e.description.replace(/"/g, '""')}",${e.debit},${e.credit},${e.balance}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Statement_${selectedClient.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Screen Only */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/clients" className="text-slate-400 hover:text-slate-600 transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Statements & Ledgers</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official chronological statements showing opening balance, sales debits, collection credits, and running balance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Selector & Filters Bar - Screen Only */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer / Party *</label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.area || 'Madina Town'} (Cat {c.partyCategory || 'B'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Transactions</option>
              <option value="Opening Balance">Opening Balance</option>
              <option value="Credit Sale">Credit Sale</option>
              <option value="Payment">Payment / Collection</option>
              <option value="Sales Return">Sales Return</option>
              <option value="Bad Debt Write-off">Bad Debt Write-off</option>
            </select>
          </div>
        </div>
      </div>

      {/* STATEMENT DOCUMENT CARD (PRINTABLE) */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Printable Letterhead Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{BUSINESS_CONFIG.name}</h2>
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mt-0.5">
                {BUSINESS_CONFIG.subtitle}
              </p>
              <p className="text-xs text-slate-600 mt-1">{BUSINESS_CONFIG.address}</p>
              <p className="text-xs text-slate-600 font-mono">
                Phone: {BUSINESS_CONFIG.phones[0]} / {BUSINESS_CONFIG.phones[1]}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider inline-block">
                Customer Statement
              </span>
              <p className="text-xs text-slate-500 mt-2">
                Statement Date: <span className="font-semibold text-slate-800">{formatDateDDMMYYYY(new Date().toISOString().split('T')[0])}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information Box */}
        {selectedClient && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-slate-500 block">Customer Name:</span>
              <span className="font-bold text-slate-900 text-sm block">{selectedClient.name}</span>
              <span className="text-[11px] text-slate-600">{selectedClient.companyName || selectedClient.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Area & Route:</span>
              <span className="font-semibold text-slate-900 block">{selectedClient.area || 'Madina Town'}</span>
              <span className="text-[11px] text-slate-600">
                {typeof selectedClient.address === 'string' ? selectedClient.address : selectedClient.address?.address}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Classification:</span>
              <span className="font-bold text-indigo-700 block">Category {selectedClient.partyCategory || 'B'}</span>
              <span className="text-[11px] text-slate-600">Phone: {selectedClient.phone}</span>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-slate-500 block">Current Outstanding:</span>
              <span className="text-base font-extrabold text-rose-600 block">{formatPKR(closingBalance)}</span>
              <span className="text-[10px] text-slate-500">Limit: {selectedClient.creditLimit ? formatPKR(selectedClient.creditLimit) : 'No Limit'}</span>
            </div>
          </div>
        )}

        {/* Chronological Statement Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference / Invoice</th>
                <th className="py-2.5 px-3">Transaction Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Debit (PKR)</th>
                <th className="py-2.5 px-3 text-right">Credit (PKR)</th>
                <th className="py-2.5 px-3 text-right">Balance (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No ledger transactions found for this customer.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((entry, index) => (
                  <tr key={entry.id || index} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {formatDateDDMMYYYY(entry.date)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {entry.reference}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        entry.type === 'Credit Sale'
                          ? 'bg-blue-50 text-blue-700'
                          : entry.type === 'Payment Received' || (entry.type as any) === 'Payment'
                          ? 'bg-emerald-50 text-emerald-700'
                          : entry.type === 'Sales Return'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                      {entry.debit > 0 ? formatPKR(entry.debit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                      {entry.credit > 0 ? formatPKR(entry.credit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatPKR(entry.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                <td colSpan={4} className="py-3 px-3 text-right">
                  Period Totals:
                </td>
                <td className="py-3 px-3 text-right text-slate-900">{formatPKR(totalDebit)}</td>
                <td className="py-3 px-3 text-right text-emerald-600">{formatPKR(totalCredit)}</td>
                <td className="py-3 px-3 text-right text-rose-600 font-extrabold">{formatPKR(closingBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Printable Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p>Terms: All invoices are due per agreed credit terms.</p>
            <p className="mt-0.5">Computer-generated statement. Valid without signature.</p>
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            <p className="font-semibold text-slate-700">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
