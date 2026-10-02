'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Calendar,
  Filter,
  Banknote,
  Users,
  ShoppingCart,
  Receipt,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Eye,
  Plus,
  Search,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate, BUSINESS_CONFIG } from '@/lib/utils';
import { PartyCategory } from '@/types';

type DateFilterType = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

export default function AreaWiseSalesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { areas, clients, orders, payments, salesReturns, recordPayment } = useAppState();

  const initialAreaName = searchParams.get('area') || areas[0]?.name || 'Madina Town';
  const [selectedAreaName, setSelectedAreaName] = useState<string>(initialAreaName);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayKarachiDate());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayKarachiDate());

  // Customer sub-filters
  const [categoryFilter, setCategoryFilter] = useState<'All' | PartyCategory>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | 'Outstanding' | 'Paid'>('All');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Collection modal state
  const [collectTargetClient, setCollectTargetClient] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [collectNotes, setCollectNotes] = useState<string>('');

  const selectedArea = areas.find(a => a.name.toLowerCase() === selectedAreaName.toLowerCase());

  // Date filtering logic
  const isDateInFilter = (dateStr: string) => {
    if (dateFilter === 'all') return true;
    const today = getTodayKarachiDate();
    const target = new Date(dateStr);
    const now = new Date(today);

    if (dateFilter === 'today') {
      return dateStr === today;
    }
    if (dateFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      return dateStr === yStr;
    }
    if (dateFilter === 'week') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return target >= sevenDaysAgo && target <= now;
    }
    if (dateFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return target >= startOfMonth && target <= now;
    }
    if (dateFilter === 'custom') {
      return dateStr >= customStartDate && dateStr <= customEndDate;
    }
    return true;
  };

  // Customers in this selected area
  const areaCustomers = useMemo(() => {
    return clients.filter(c => c.area.toLowerCase() === selectedAreaName.toLowerCase());
  }, [clients, selectedAreaName]);

  // Sales orders for this area within the date filter
  const areaOrders = useMemo(() => {
    return orders.filter(o => o.area.toLowerCase() === selectedAreaName.toLowerCase() && isDateInFilter(o.orderDate));
  }, [orders, selectedAreaName, dateFilter, customStartDate, customEndDate]);

  // Sales returns for this area
  const areaReturns = useMemo(() => {
    return salesReturns.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return client?.area.toLowerCase() === selectedAreaName.toLowerCase() && isDateInFilter(r.returnDate);
    });
  }, [salesReturns, clients, selectedAreaName, dateFilter, customStartDate, customEndDate]);

  // Customer collections for this area
  const areaCollections = useMemo(() => {
    return payments.filter(p => {
      const client = clients.find(c => c.id === p.clientId);
      const matchesArea = (p.area && p.area.toLowerCase() === selectedAreaName.toLowerCase()) ||
        (client && client.area.toLowerCase() === selectedAreaName.toLowerCase());
      return matchesArea && isDateInFilter(p.paymentDate);
    });
  }, [payments, clients, selectedAreaName, dateFilter, customStartDate, customEndDate]);

  // Area Summary Metrics Calculation
  const totalCustomers = areaCustomers.length;
  const aCategoryCustomers = areaCustomers.filter(c => c.partyCategory === 'A').length;
  const bCategoryCustomers = areaCustomers.filter(c => c.partyCategory === 'B').length;
  const cCategoryCustomers = areaCustomers.filter(c => c.partyCategory === 'C').length;

  const totalGrossSales = areaOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalCashSales = areaOrders.reduce((sum, o) => sum + o.amountPaid, 0);
  const totalCreditSales = areaOrders.reduce((sum, o) => sum + o.amountRemaining, 0);
  const totalCollections = areaCollections.reduce((sum, p) => sum + p.amount, 0);
  const totalReturns = areaReturns.reduce((sum, r) => sum + r.refundAmount, 0);
  const netSales = Math.max(0, totalGrossSales - totalReturns);
  const totalOutstandingCredit = areaCustomers.reduce((sum, c) => sum + c.currentBalance, 0);

  // Filtered customer list for the table
  const filteredCustomers = areaCustomers.filter(c => {
    if (categoryFilter !== 'All' && c.partyCategory !== categoryFilter) return false;
    if (paymentStatusFilter === 'Outstanding' && c.currentBalance <= 0) return false;
    if (paymentStatusFilter === 'Paid' && c.currentBalance > 0) return false;
    if (activeFilter === 'Active' && c.status !== 'Active') return false;
    if (activeFilter === 'Inactive' && c.status === 'Active') return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        c.companyName.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.clientId.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenCollection = (customer: any) => {
    setCollectTargetClient(customer);
    setCollectAmount(customer.currentBalance > 0 ? customer.currentBalance : 1000);
    setCollectMethod('Cash');
    setCollectNotes(`Area collection from ${customer.companyName} (${selectedAreaName})`);
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectTargetClient || collectAmount <= 0) return;

    recordPayment({
      clientId: collectTargetClient.id,
      clientName: collectTargetClient.name,
      companyName: collectTargetClient.companyName,
      area: selectedAreaName,
      paymentDate: getTodayKarachiDate(),
      amount: collectAmount,
      paymentMethod: collectMethod,
      referenceNumber: `CASH-${Date.now().toString().slice(-4)}`,
      notes: collectNotes,
      recordedBy: 'Hamza Farooq',
    });

    setCollectTargetClient(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Select Area Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-erp space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-emerald-600" /> Area-wise Sales & Route Intelligence
            </h1>
            <p className="text-xs text-slate-500">
              Live distribution performance, customer categorization, and credit recovery for Faisalabad territories.
            </p>
          </div>

          {/* Area Selector Dropdown */}
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Area:</label>
            <select
              value={selectedAreaName}
              onChange={e => {
                setSelectedAreaName(e.target.value);
                router.replace(`/sales/area?area=${encodeURIComponent(e.target.value)}`);
              }}
              className="px-3.5 py-2 bg-emerald-50 border-2 border-emerald-600 rounded-lg text-sm font-bold text-slate-900 focus:outline-none"
            >
              {areas.map(a => (
                <option key={a.id} value={a.name}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>

            <Link
              href={`/clients/new?area=${encodeURIComponent(selectedAreaName)}`}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Customer to {selectedAreaName}</span>
            </Link>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="font-semibold text-slate-500 mr-1 flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" /> Date:
            </span>
            {(['today', 'yesterday', 'week', 'month', 'all', 'custom'] as DateFilterType[]).map(df => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition ${
                  dateFilter === df
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {df === 'today'
                  ? 'Today'
                  : df === 'yesterday'
                  ? 'Yesterday'
                  : df === 'week'
                  ? 'This Week'
                  : df === 'month'
                  ? 'This Month'
                  : df === 'all'
                  ? 'All Time'
                  : 'Custom'}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-2 font-mono text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded"
              />
            </div>
          )}

          <div className="text-[11px] text-slate-500 font-mono">
            Route Rep: <span className="font-bold text-slate-800">{selectedArea?.assignedSalesperson || 'Hamza Farooq'}</span>
          </div>
        </div>
      </div>

      {/* AREA SUMMARY CARDS */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
          <MapPin className="h-4 w-4 mr-1 text-brand-600" /> Area Summary — {selectedAreaName}
        </h2>

        {/* Customer Breakdown Top Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Customers</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{totalCustomers}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Assigned to {selectedAreaName}</span>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-erp">
            <span className="text-[10px] font-bold uppercase text-purple-600 block">A Category Customers</span>
            <span className="text-2xl font-black text-purple-900 font-mono">{aCategoryCustomers}</span>
            <span className="text-[10px] text-purple-700 block mt-0.5">High volume supermarkets</span>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-erp">
            <span className="text-[10px] font-bold uppercase text-blue-600 block">B Category Customers</span>
            <span className="text-2xl font-black text-blue-900 font-mono">{bCategoryCustomers}</span>
            <span className="text-[10px] text-blue-700 block mt-0.5">Medium volume stores</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 shadow-erp">
            <span className="text-[10px] font-bold uppercase text-slate-600 block">C Category Customers</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{cCategoryCustomers}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Low volume / cash kiosks</span>
          </div>
        </div>

        {/* Financial Breakdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-erp">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Total Sales</span>
            <span className="text-sm font-black font-mono text-slate-900">{formatPKR(totalGrossSales)}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-erp">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Cash Sales</span>
            <span className="text-sm font-black font-mono text-emerald-700">{formatPKR(totalCashSales)}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-erp">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Credit Sales</span>
            <span className="text-sm font-black font-mono text-blue-700">{formatPKR(totalCreditSales)}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-erp">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Collections</span>
            <span className="text-sm font-black font-mono text-emerald-600">{formatPKR(totalCollections)}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-erp">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Sales Returns</span>
            <span className="text-sm font-black font-mono text-rose-600">{formatPKR(totalReturns)}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 shadow-erp">
            <span className="text-[9px] font-bold uppercase text-emerald-700 block">Net Sales</span>
            <span className="text-sm font-black font-mono text-emerald-900">{formatPKR(netSales)}</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 shadow-erp">
            <span className="text-[9px] font-bold uppercase text-rose-700 block">Outstanding Credit</span>
            <span className="text-sm font-black font-mono text-rose-700">{formatPKR(totalOutstandingCredit)}</span>
          </div>
        </div>
      </div>

      {/* CUSTOMER LIST SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-erp space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Customer / Party List — {selectedAreaName}</h3>
            <p className="text-xs text-slate-500">Live balance and transactional history for shops located in this area</p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search shop / owner..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-48 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Filters Bar: A, B, C, All, Outstanding, Paid, Active, Inactive */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-semibold text-[11px]">Category:</span>
            {(['All', 'A', 'B', 'C'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-200 pl-3">
            <span className="text-slate-500 font-semibold text-[11px]">Credit:</span>
            {(['All', 'Outstanding', 'Paid'] as const).map(status => (
              <button
                key={status}
                onClick={() => setPaymentStatusFilter(status)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  paymentStatusFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-200 pl-3">
            <span className="text-slate-500 font-semibold text-[11px]">Status:</span>
            {(['All', 'Active', 'Inactive'] as const).map(st => (
              <button
                key={st}
                onClick={() => setActiveFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  activeFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="ml-auto text-xs font-mono text-slate-500">
            Showing <span className="font-bold text-slate-900">{filteredCustomers.length}</span> customers
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Customer / Shop Name</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3 text-center">Category</th>
                <th className="py-2.5 px-3 text-right">Opening Bal</th>
                <th className="py-2.5 px-3 text-right">Sales</th>
                <th className="py-2.5 px-3 text-right">Collections</th>
                <th className="py-2.5 px-3 text-right">Returns</th>
                <th className="py-2.5 px-3 text-right">Outstanding Credit</th>
                <th className="py-2.5 px-3">Last Tx</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No customers found matching the selected filters in {selectedAreaName}.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  // Calculate dynamic customer stats within the date filter
                  const custOrders = orders.filter(o => o.clientId === c.id && isDateInFilter(o.orderDate));
                  const custSales = custOrders.reduce((sum, o) => sum + o.grandTotal, 0);
                  const custPmt = payments.filter(p => p.clientId === c.id && isDateInFilter(p.paymentDate));
                  const custCollections = custPmt.reduce((sum, p) => sum + p.amount, 0);
                  const custRet = salesReturns.filter(r => r.clientId === c.id && isDateInFilter(r.returnDate));
                  const custReturns = custRet.reduce((sum, r) => sum + r.refundAmount, 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3">
                        <Link href={`/clients/${c.id}`} className="font-bold text-slate-900 hover:text-brand-600 block">
                          {c.companyName}
                        </Link>
                        <span className="text-[10px] text-slate-500 font-mono">{c.clientId} • {c.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {c.phone}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.partyCategory === 'A'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : c.partyCategory === 'B'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          Cat {c.partyCategory}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatPKR(c.openingBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatPKR(custSales)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatPKR(custCollections)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                        {formatPKR(custReturns)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black">
                        <span className={c.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {formatPKR(c.currentBalance)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {c.lastTransactionDate ? formatDateDDMMYYYY(c.lastTransactionDate) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Link
                            href={`/clients/${c.id}`}
                            title="View Customer Profile"
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/clients/${c.id}/ledger`}
                            title="View Statement"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/orders/new?clientId=${c.id}`}
                            title="Create Sale"
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleOpenCollection(c)}
                            title="Record Collection"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Collection Modal */}
      {collectTargetClient && (
        <Modal
          isOpen={!!collectTargetClient}
          onClose={() => setCollectTargetClient(null)}
          title={`Record Collection — ${collectTargetClient.companyName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveCollection} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{collectTargetClient.companyName}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Area:</span>
                <span className="font-semibold text-slate-800">{selectedAreaName}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Current Outstanding Receivable:</span>
                <span className="font-bold text-rose-600 font-mono">{formatPKR(collectTargetClient.currentBalance)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Collected Amount (PKR) *</label>
              <input
                type="number"
                min="1"
                value={collectAmount}
                onChange={e => setCollectAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700 text-sm"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={collectMethod}
                onChange={e => setCollectMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                <option value="Cash">Cash Handover</option>
                <option value="Bank Transfer">Bank Transfer / Online Transfer</option>
                <option value="Cheque">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt Notes / Reference</label>
              <input
                type="text"
                placeholder="e.g. Route recovery collected by Hamza Farooq"
                value={collectNotes}
                onChange={e => setCollectNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setCollectTargetClient(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Post Collection
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
