'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  AlertCircle,
  Clock,
  TrendingDown,
  Building2,
  MapPin,
  Search,
  Filter,
  Download,
  Banknote,
  ChevronRight,
  ArrowUpRight,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';
import { Client, Order } from '@/types';

interface AgingInvoice {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  area: string;
  partyCategory: 'A' | 'B' | 'C';
  date: string;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  ageDays: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
}

export default function MarketCreditPage() {
  const { clients, orders, areas, recordPayment, currentUser } = useAppState();

  const [activeTab, setActiveTab] = useState<'customer_summary' | 'invoice_aging'>('customer_summary');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAgingBucket, setSelectedAgingBucket] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick collection modal state
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectClient, setCollectClient] = useState<Client | null>(null);
  const [collectAmount, setCollectAmount] = useState(0);
  const [collectMethod, setCollectMethod] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [collectNotes, setCollectNotes] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute Unpaid / Partially Paid Invoices for Aging
  const agingInvoices: AgingInvoice[] = [];

  orders.forEach(order => {
    // Only consider credit sales or partial balances
    const remaining = (order.total || order.grandTotal) - (order.paidAmount || order.amountPaid || 0);
    if (remaining > 0 && order.status !== 'Cancelled') {
      const orderDateStr = order.date || order.orderDate || '2026-10-01';
      const orderDate = new Date(orderDateStr);
      orderDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - orderDate.getTime();
      const ageDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      let agingBucket: '0-30' | '31-60' | '61-90' | '90+' = '0-30';
      if (ageDays > 90) agingBucket = '90+';
      else if (ageDays > 60) agingBucket = '61-90';
      else if (ageDays > 30) agingBucket = '31-60';

      const client = clients.find(c => c.id === order.clientId);

      agingInvoices.push({
        id: order.id,
        orderNumber: order.orderNumber,
        clientId: order.clientId,
        clientName: order.clientName,
        area: client?.area || 'Madina Town',
        partyCategory: (client?.partyCategory as any) || 'B',
        date: orderDateStr,
        total: order.total || order.grandTotal,
        paidAmount: order.paidAmount || order.amountPaid || 0,
        remainingAmount: remaining,
        ageDays,
        agingBucket,
      });
    }
  });

  // Calculate Market Credit Aggregates
  const totalMarketCredit = clients.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

  // A/B/C breakdown
  const creditCatA = clients.filter(c => c.partyCategory === 'A').reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const creditCatB = clients.filter(c => c.partyCategory === 'B').reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const creditCatC = clients.filter(c => c.partyCategory === 'C').reduce((sum, c) => sum + (c.currentBalance || 0), 0);

  // Aging totals
  const aging0to30 = agingInvoices.filter(i => i.agingBucket === '0-30').reduce((sum, i) => sum + i.remainingAmount, 0);
  const aging31to60 = agingInvoices.filter(i => i.agingBucket === '31-60').reduce((sum, i) => sum + i.remainingAmount, 0);
  const aging61to90 = agingInvoices.filter(i => i.agingBucket === '61-90').reduce((sum, i) => sum + i.remainingAmount, 0);
  const aging90plus = agingInvoices.filter(i => i.agingBucket === '90+').reduce((sum, i) => sum + i.remainingAmount, 0);

  // Filtered Clients
  const filteredClients = clients.filter(c => {
    if (selectedArea !== 'All' && c.area !== selectedArea) return false;
    if (selectedCategory !== 'All' && c.partyCategory !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.companyName && c.companyName.toLowerCase().includes(q)) || c.phone.includes(q);
    }
    return true;
  });

  // Filtered Invoices
  const filteredAgingInvoices = agingInvoices.filter(i => {
    if (selectedArea !== 'All' && i.area !== selectedArea) return false;
    if (selectedCategory !== 'All' && i.partyCategory !== selectedCategory) return false;
    if (selectedAgingBucket !== 'All' && i.agingBucket !== selectedAgingBucket) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return i.clientName.toLowerCase().includes(q) || i.orderNumber.toLowerCase().includes(q);
    }
    return true;
  });

  // Handle Collection Recording
  const handleRecordCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectClient || collectAmount <= 0) return;

    recordPayment({
      clientId: collectClient.id,
      clientName: collectClient.name,
      amount: collectAmount,
      paymentDate: getTodayKarachiDate(),
      paymentMethod: collectMethod as any,
      referenceNumber: `REC-${Date.now().toString().slice(-4)}`,
      notes: collectNotes || `Collection from ${collectClient.name}`,
      recordedBy: currentUser?.name || 'Administrator',
    });

    setCollectionModalOpen(false);
    setCollectClient(null);
    setCollectAmount(0);
    setCollectNotes('');
  };

  const handleExportCSV = () => {
    const headers = 'Customer,Area,Category,Phone,Opening Balance,Total Sales,Total Collected,Current Outstanding Balance,Credit Limit\n';
    const rows = filteredClients
      .map(
        c =>
          `"${c.name}","${c.area || 'Madina Town'}","${c.partyCategory || 'B'}","${c.phone}",${c.openingBalance || 0},${c.totalPurchases || 0},${c.totalPaid || 0},${c.currentBalance || 0},${c.creditLimit || 0}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Market_Credit_${getTodayKarachiDate()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Market Credit & Receivables</h1>
          <p className="text-xs text-slate-500 mt-1">
            Total trade receivables owed by confectionery and cold drink retailer network across Faisalabad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Download className="h-4 w-4" />
            <span>Export Credit List</span>
          </button>
          <Link
            href="/accounts/payments"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Banknote className="h-4 w-4" />
            <span>Record Collection</span>
          </Link>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-900">Total Market Credit</span>
            <Banknote className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-950 mt-2">{formatPKR(totalMarketCredit)}</p>
          <p className="text-xs text-indigo-700 mt-1">Owed by {clients.filter(c => c.currentBalance > 0).length} retailer accounts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Category A Receivables</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">High Volume</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatPKR(creditCatA)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {totalMarketCredit > 0 ? ((creditCatA / totalMarketCredit) * 100).toFixed(1) : 0}% of total debt
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Category B Receivables</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Medium Volume</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatPKR(creditCatB)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {totalMarketCredit > 0 ? ((creditCatB / totalMarketCredit) * 100).toFixed(1) : 0}% of total debt
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Category C Receivables</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Retail / Low</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatPKR(creditCatC)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {totalMarketCredit > 0 ? ((creditCatC / totalMarketCredit) * 100).toFixed(1) : 0}% of total debt
          </p>
        </div>
      </div>

      {/* Aging Analysis Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Receivable Aging Schedule</h2>
            <p className="text-xs text-slate-500">Aging buckets calculated from actual invoice generation dates.</p>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            Total Overdue (&gt;30d):{' '}
            <span className="font-bold text-rose-600">{formatPKR(aging31to60 + aging61to90 + aging90plus)}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 block">0–30 Days (Current)</span>
            <span className="text-lg font-bold text-emerald-900 block mt-1">{formatPKR(aging0to30)}</span>
            <span className="text-[10px] text-emerald-700">Normal credit cycle</span>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800 block">31–60 Days</span>
            <span className="text-lg font-bold text-amber-900 block mt-1">{formatPKR(aging31to60)}</span>
            <span className="text-[10px] text-amber-700">Follow-up due</span>
          </div>

          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <span className="text-[11px] font-semibold text-orange-800 block">61–90 Days</span>
            <span className="text-lg font-bold text-orange-900 block mt-1">{formatPKR(aging61to90)}</span>
            <span className="text-[10px] text-orange-700">Critical overdue</span>
          </div>

          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
            <span className="text-[11px] font-semibold text-rose-800 block">90+ Days (High Risk)</span>
            <span className="text-lg font-bold text-rose-900 block mt-1">{formatPKR(aging90plus)}</span>
            <span className="text-[10px] text-rose-700">Potential bad debt</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('customer_summary')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'customer_summary'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Customer Ledger Balances ({clients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('invoice_aging')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'invoice_aging'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Unpaid Invoice Aging Details ({agingInvoices.length})</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Area:</span>
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Areas</option>
              {areas.map(a => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="A">Cat A (High Volume)</option>
              <option value="B">Cat B (Medium Volume)</option>
              <option value="C">Cat C (Retail / Low)</option>
            </select>
          </div>

          {activeTab === 'invoice_aging' && (
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-semibold">Aging:</span>
              <select
                value={selectedAgingBucket}
                onChange={e => setSelectedAgingBucket(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Buckets</option>
                <option value="0-30">0–30 Days</option>
                <option value="31-60">31–60 Days</option>
                <option value="61-90">61–90 Days</option>
                <option value="90+">90+ Days</option>
              </select>
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search party or invoice..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* TAB 1: CUSTOMER BALANCES TABLE */}
      {activeTab === 'customer_summary' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Customer / Shop Name</th>
                  <th className="py-3 px-4">Area & Route</th>
                  <th className="py-3 px-4">Cat</th>
                  <th className="py-3 px-4">Opening Balance</th>
                  <th className="py-3 px-4">Gross Sales</th>
                  <th className="py-3 px-4">Collections</th>
                  <th className="py-3 px-4">Current Outstanding</th>
                  <th className="py-3 px-4">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No customers match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(c => {
                    const isOverLimit = (c.currentBalance || 0) > (c.creditLimit || 0) && (c.creditLimit || 0) > 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <Link href={`/clients/${c.id}/ledger`} className="font-bold text-slate-900 hover:text-indigo-600 transition block">
                            {c.name}
                          </Link>
                          <span className="text-[11px] text-slate-500">{c.companyName || c.name} • {c.phone}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1 text-slate-700">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{c.area || 'Madina Town'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.partyCategory === 'A'
                              ? 'bg-purple-100 text-purple-800'
                              : c.partyCategory === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            Cat {c.partyCategory || 'B'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatPKR(c.openingBalance || 0)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{formatPKR(c.totalPurchases || 0)}</td>
                        <td className="py-3 px-4 text-emerald-600 font-semibold">{formatPKR(c.totalPaid || 0)}</td>
                        <td className="py-3 px-4">
                          <span className={`font-bold block ${c.currentBalance > 0 ? 'text-indigo-900' : 'text-slate-500'}`}>
                            {formatPKR(c.currentBalance || 0)}
                          </span>
                          {isOverLimit && (
                            <span className="text-[10px] font-bold text-red-600 flex items-center space-x-0.5">
                              <AlertCircle className="h-3 w-3 inline" />
                              <span>Over Limit</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {c.creditLimit ? formatPKR(c.creditLimit) : 'No Limit'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {c.currentBalance > 0 && (
                            <button
                              onClick={() => {
                                setCollectClient(c);
                                setCollectAmount(c.currentBalance);
                                setCollectionModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded text-xs transition"
                            >
                              Collect
                            </button>
                          )}
                          <Link
                            href={`/clients/${c.id}/ledger`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition inline-block"
                          >
                            Statement
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICE AGING SCHEDULE TABLE */}
      {activeTab === 'invoice_aging' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice No / Date</th>
                  <th className="py-3 px-4">Customer & Area</th>
                  <th className="py-3 px-4">Cat</th>
                  <th className="py-3 px-4">Original Amount</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Remaining Balance</th>
                  <th className="py-3 px-4">Age (Days)</th>
                  <th className="py-3 px-4">Aging Bucket</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAgingInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No unpaid invoices in this aging bucket.
                    </td>
                  </tr>
                ) : (
                  filteredAgingInvoices.map(inv => {
                    let bucketStyle = 'bg-emerald-100 text-emerald-800';
                    if (inv.agingBucket === '31-60') bucketStyle = 'bg-amber-100 text-amber-800';
                    else if (inv.agingBucket === '61-90') bucketStyle = 'bg-orange-100 text-orange-800';
                    else if (inv.agingBucket === '90+') bucketStyle = 'bg-rose-100 text-rose-800';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <Link href={`/orders/${inv.id}`} className="font-mono font-bold text-slate-900 hover:text-indigo-600 block">
                            {inv.orderNumber}
                          </Link>
                          <span className="text-[11px] text-slate-500">{formatDateDDMMYYYY(inv.date)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{inv.clientName}</span>
                          <span className="text-[11px] text-slate-500">{inv.area}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            Cat {inv.partyCategory}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{formatPKR(inv.total)}</td>
                        <td className="py-3 px-4 text-emerald-600 font-semibold">{formatPKR(inv.paidAmount)}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">{formatPKR(inv.remainingAmount)}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{inv.ageDays} days</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bucketStyle}`}>
                            {inv.agingBucket} Days
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/orders/${inv.id}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition inline-block"
                          >
                            View Invoice
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK COLLECTION MODAL */}
      {collectionModalOpen && collectClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900">Record Customer Collection</h2>
            <p className="text-xs text-slate-500 mt-1">
              Receipt will reduce {collectClient.name}&apos;s outstanding receivable balance.
            </p>

            <form onSubmit={handleRecordCollection} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Retailer:</span>
                  <span className="font-bold text-slate-900">{collectClient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Area:</span>
                  <span className="text-slate-700">{collectClient.area || 'Madina Town'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Outstanding Balance:</span>
                  <span className="font-bold text-rose-600">{formatPKR(collectClient.currentBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Received Amount (PKR) *</label>
                <input
                  type="number"
                  min="1"
                  max={collectClient.currentBalance}
                  value={collectAmount}
                  onChange={e => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={collectMethod}
                    onChange={e => setCollectMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Cash">Cash Receipt</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Remaining Balance</label>
                  <div className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-800">
                    {formatPKR(Math.max(0, collectClient.currentBalance - collectAmount))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly recovery collected by delivery van"
                  value={collectNotes}
                  onChange={e => setCollectNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Post Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
