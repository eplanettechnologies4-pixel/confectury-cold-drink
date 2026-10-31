'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Calendar,
  Download,
  Printer,
  Package,
  Receipt,
  Users,
  Store,
  CreditCard,
  CheckCircle,
  Eye,
  Plus,
  Coins,
  ArrowRight,
  TrendingUp,
  MapPin,
  Search,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate, BUSINESS_CONFIG } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface SalespersonDailyReportViewProps {
  initialSalesperson?: string;
  initialDate?: string;
  isStandalone?: boolean;
}

interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  price: number;
  qty: number;
  total: number;
  orderCount: number;
}

export default function SalespersonDailyReportView({
  initialSalesperson = 'ALL',
  initialDate,
  isStandalone = false,
}: SalespersonDailyReportViewProps) {
  const { clients, products, orders, payments, areas, staff } = useAppState();

  const todayStr = getTodayKarachiDate();
  const [reportDate, setReportDate] = useState<string>(initialDate || todayStr);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>(initialSalesperson);
  const [activeTab, setActiveTab] = useState<'products' | 'invoices' | 'team'>('products');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Yesterday date calculation
  const yesterdayStr = useMemo(() => {
    try {
      const d = new Date(todayStr);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    } catch {
      return todayStr;
    }
  }, [todayStr]);

  // Unique salespersons list
  const allSalespersons = useMemo(() => {
    const names = new Set<string>();
    staff.forEach(s => {
      if (s.name) names.add(s.name);
    });
    orders.forEach(o => {
      if (o.salesperson) names.add(o.salesperson);
    });
    areas.forEach(a => {
      if (a.assignedSalesperson) names.add(a.assignedSalesperson);
    });
    clients.forEach(c => {
      if (c.salesRep) names.add(c.salesRep);
    });
    if (names.size === 0) names.add('Admin');
    return Array.from(names).sort();
  }, [staff, orders, areas, clients]);

  // Find areas assigned to a salesperson
  const getSalespersonRouteList = (sp: string): string[] => {
    const set = new Set<string>();
    areas.forEach(a => {
      if (a.assignedSalesperson?.trim().toLowerCase() === sp.trim().toLowerCase() && a.name?.trim()) {
        set.add(a.name.trim());
      }
    });
    clients.forEach(c => {
      if (c.salesRep?.trim().toLowerCase() === sp.trim().toLowerCase() && c.area?.trim()) {
        set.add(c.area.trim());
      }
    });
    return Array.from(set);
  };

  const getSalespersonRoute = (sp: string): string => {
    const list = getSalespersonRouteList(sp);
    if (list.length === 0) return 'All Areas';
    if (list.length <= 3) return list.join(', ');
    return `${list.slice(0, 3).join(', ')} (+${list.length - 3} more)`;
  };

  const getSalespersonFullRoute = (sp: string): string => {
    const list = getSalespersonRouteList(sp);
    return list.length > 0 ? list.join(', ') : 'All Areas';
  };

  // Orders filtered for the selected date and salesperson
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'Cancelled') return false;
      const orderDate = (o.date || o.orderDate || '').slice(0, 10);
      if (orderDate !== reportDate) return false;

      if (selectedSalesperson !== 'ALL') {
        if ((o.salesperson || '').toLowerCase() !== selectedSalesperson.toLowerCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCustomer = (o.clientName || '').toLowerCase().includes(q) || (o.companyName || '').toLowerCase().includes(q);
        const matchInvoice = (o.orderNumber || '').toLowerCase().includes(q);
        const matchArea = (o.area || '').toLowerCase().includes(q);
        const matchProduct = (o.items || []).some(it => (it.productName || '').toLowerCase().includes(q));
        if (!matchCustomer && !matchInvoice && !matchArea && !matchProduct) return false;
      }

      return true;
    });
  }, [orders, reportDate, selectedSalesperson, searchQuery]);

  // Group items by product to get "Products and Prices"
  const productSummaries = useMemo((): ProductSummary[] => {
    const map = new Map<string, ProductSummary>();

    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const key = item.productId || item.sku || item.productName;
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice || item.price) || 0;
        const total = Number(item.total) || qty * price;

        const existing = map.get(key);
        if (existing) {
          existing.qty += qty;
          existing.total += total;
          existing.orderCount += 1;
        } else {
          map.set(key, {
            id: key,
            name: item.productName,
            sku: item.sku || 'SKU',
            category: item.category || 'General',
            unit: item.unit || 'Unit',
            price,
            qty,
            total,
            orderCount: 1,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredOrders]);

  // Financial summary numbers
  const totalSales = filteredOrders.reduce((sum, o) => sum + (o.total || o.grandTotal || 0), 0);
  const cashCollected = filteredOrders.reduce((sum, o) => sum + (o.paidAmount || o.amountPaid || 0), 0);
  const dailyDebtCreated = filteredOrders.reduce((sum, o) => {
    const tot = o.total || o.grandTotal || 0;
    const paid = o.paidAmount || o.amountPaid || 0;
    return sum + Math.max(0, tot - paid);
  }, 0);

  // Total outstanding debt for clients assigned to this salesperson
  const routeClients = useMemo(() => {
    if (selectedSalesperson === 'ALL') return clients;
    return clients.filter(c => (c.salesRep || '').toLowerCase() === selectedSalesperson.toLowerCase());
  }, [clients, selectedSalesperson]);

  const totalMarketDebt = routeClients.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalItemsSold = productSummaries.reduce((sum, p) => sum + p.qty, 0);

  // Per salesperson summary for the "Team Summary" tab
  const teamMetrics = useMemo(() => {
    return allSalespersons.map(sp => {
      const spOrders = orders.filter(o => {
        if (o.status === 'Cancelled') return false;
        const d = (o.date || o.orderDate || '').slice(0, 10);
        return d === reportDate && (o.salesperson || '').toLowerCase() === sp.toLowerCase();
      });

      const spSales = spOrders.reduce((sum, o) => sum + (o.total || o.grandTotal || 0), 0);
      const spCash = spOrders.reduce((sum, o) => sum + (o.paidAmount || o.amountPaid || 0), 0);
      const spDebt = spOrders.reduce((sum, o) => {
        const t = o.total || o.grandTotal || 0;
        const p = o.paidAmount || o.amountPaid || 0;
        return sum + Math.max(0, t - p);
      }, 0);

      const spClients = clients.filter(c => (c.salesRep || '').toLowerCase() === sp.toLowerCase());
      const spTotalMarketDebt = spClients.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

      return {
        name: sp,
        route: getSalespersonRoute(sp),
        ordersCount: spOrders.length,
        sales: spSales,
        cash: spCash,
        debt: spDebt,
        debtPercent: spSales > 0 ? (spDebt / spSales) * 100 : 0,
        totalMarketDebt: spTotalMarketDebt,
      };
    });
  }, [allSalespersons, orders, clients, reportDate]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let csv = `AHMAD TRADERS - SALESPERSON DAILY REPORT\n`;
    csv += `Date:,"${reportDate}"\n`;
    csv += `Salesperson:,"${selectedSalesperson === 'ALL' ? 'All Salespersons' : selectedSalesperson}"\n`;
    csv += `Total Sales:,"Rs. ${totalSales}"\n`;
    csv += `Cash Collected:,"Rs. ${cashCollected}"\n`;
    csv += `Today's Debt:,"Rs. ${dailyDebtCreated}"\n\n`;

    csv += `PRODUCTS & PRICES SOLD TODAY\n`;
    csv += `Product Name,Category,Unit,Unit Price (PKR),Quantity Sold,Total Amount (PKR)\n`;
    productSummaries.forEach(p => {
      csv += `"${p.name}","${p.category}","${p.unit}",${p.price},${p.qty},${p.total}\n`;
    });
    csv += `\n`;

    csv += `INVOICES & DAILY DEBT\n`;
    csv += `Invoice #,Date,Customer,Area,Total Bill (PKR),Cash Paid (PKR),Today's Debt (PKR),Customer Total Balance (PKR)\n`;
    filteredOrders.forEach(o => {
      const tot = o.total || o.grandTotal || 0;
      const paid = o.paidAmount || o.amountPaid || 0;
      const debt = Math.max(0, tot - paid);
      const cl = clients.find(c => c.id === o.clientId);
      csv += `"${o.orderNumber}","${(o.date || o.orderDate || '').slice(0, 10)}","${o.clientName}","${o.area || ''}",${tot},${paid},${debt},${cl?.currentBalance || debt}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daily_Report_${selectedSalesperson}_${reportDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP CONTROL BAR (CLEAN & DIRECT) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Description */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <UserCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Salesperson Daily Report
                </h2>
                <p className="text-xs text-slate-500">
                  Track products sold, prices charged, cash collected, and daily debt (Udhaar) for each salesperson.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print Daily Sheet</span>
            </button>
          </div>
        </div>

        {/* Filters: Salesperson & Date Selection */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Salesperson Picker */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Salesperson:</label>
            <select
              value={selectedSalesperson}
              onChange={e => setSelectedSalesperson(e.target.value)}
              className="w-full truncate px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs text-xs"
            >
              <option value="ALL">All Salespersons (Combined View)</option>
              {allSalespersons.map(sp => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>

            {/* Clean Route Pill Below Dropdown (Prevents dropdown menu cutoff) */}
            {selectedSalesperson !== 'ALL' && (
              <div
                className="mt-1.5 flex items-center text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-1 overflow-hidden"
                title={getSalespersonFullRoute(selectedSalesperson)}
              >
                <MapPin className="h-3 w-3 text-indigo-600 shrink-0 mr-1" />
                <span className="font-semibold text-slate-700 shrink-0 mr-1">Route:</span>
                <span className="truncate text-slate-600 font-medium">
                  {getSalespersonRoute(selectedSalesperson)}
                </span>
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Date:</label>
            <div className="flex space-x-1.5">
              <input
                type="date"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setReportDate(todayStr)}
                className={`px-3 py-2 text-xs font-bold rounded-lg border transition ${
                  reportDate === todayStr
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setReportDate(yesterdayStr)}
                className={`px-3 py-2 text-xs font-bold rounded-lg border transition ${
                  reportDate === yesterdayStr
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Search in Report:</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search product, customer, bill..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRINT-ONLY HEADER (LOOKS LIKE AN OFFICIAL WHOLESALE RUN SHEET) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{BUSINESS_CONFIG.name}</h1>
            <p className="text-xs font-bold text-indigo-800">{BUSINESS_CONFIG.subtitle}</p>
            <p className="text-xs text-slate-600 mt-0.5">{BUSINESS_CONFIG.address}</p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold uppercase inline-block">
              DAILY SALESPERSON SHEET
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">
              Salesperson: {selectedSalesperson === 'ALL' ? 'All Salespersons' : selectedSalesperson}
            </p>
            <p className="text-xs text-slate-600">Date: {formatDateDDMMYYYY(reportDate)}</p>
          </div>
        </div>
      </div>

      {/* 3. THE 4 ESSENTIAL SUMMARY CARDS (SUPER EASY TO UNDERSTAND) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            1. Total Sales Today
          </span>
          <span className="text-xl sm:text-2xl font-black text-indigo-700 mt-1 block">
            {formatPKR(totalSales)}
          </span>
          <span className="text-[11px] text-slate-500">
            {filteredOrders.length} wholesale orders
          </span>
        </div>

        {/* Card 2: Cash Received */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            2. Cash Received
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">
            {formatPKR(cashCollected)}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">
            Cash in hand to hand over
          </span>
        </div>

        {/* Card 3: Today's Debt (Udhaar) */}
        <div className="bg-white p-4 rounded-xl border-2 border-rose-300 bg-rose-50/30 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center">
            <CreditCard className="h-3.5 w-3.5 mr-1" /> 3. Today's Debt (Udhaar)
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 mt-1 block">
            {formatPKR(dailyDebtCreated)}
          </span>
          <span className="text-[11px] text-rose-700 font-medium">
            {totalSales > 0 ? `${((dailyDebtCreated / totalSales) * 100).toFixed(0)}% sold on credit` : 'No credit created'}
          </span>
        </div>

        {/* Card 4: Total Route Market Debt */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            4. Total Pending Debt
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
            {formatPKR(totalMarketDebt)}
          </span>
          <span className="text-[11px] text-slate-500">
            Total balance owed by retailers
          </span>
        </div>
      </div>

      {/* 4. CLEAN TAB NAVIGATION (ONLY 3 CLEAR TABS) */}
      <div className="flex border-b border-slate-200 space-x-1 no-print">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Products & Prices Sold ({productSummaries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'invoices'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Invoices & Daily Debt ({filteredOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'team'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Compare All Salespeople ({allSalespersons.length})</span>
        </button>
      </div>

      {/* 5. TAB 1: PRODUCTS & PRICES SOLD (CLEAR TABLE) */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Products Sold & Prices Charged on {formatDateDDMMYYYY(reportDate)}
              </h3>
              <p className="text-xs text-slate-500">
                Showing all items, packaging units, and wholesale prices sold by{' '}
                <strong className="text-slate-800">
                  {selectedSalesperson === 'ALL' ? 'all sales reps' : selectedSalesperson}
                </strong>.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
              Total Units Sold: {totalItemsSold.toLocaleString()}
            </span>
          </div>

          {productSummaries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No products sold on this date for the selected salesperson.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Unit</th>
                    <th className="py-3 px-3 text-right bg-indigo-50/40 text-indigo-900 font-black">
                      Price per Unit (PKR)
                    </th>
                    <th className="py-3 px-3 text-right">Quantity Sold</th>
                    <th className="py-3 px-4 text-right font-black">Total Sales (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productSummaries.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{p.sku}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.category === 'Cold Drinks'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{p.unit}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 bg-indigo-50/20 text-xs sm:text-sm">
                        {formatPKR(p.price)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {p.qty.toLocaleString()} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700 text-xs sm:text-sm">
                        {formatPKR(p.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                    <td colSpan={4} className="py-3 px-4 text-right">
                      Total Product Sales:
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-700 font-black">
                      {totalItemsSold.toLocaleString()} Units
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-700 font-black text-sm">
                      {formatPKR(totalSales)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2: INVOICES & DAILY DEBT (CLEAR TABLE) */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Invoices & Today's Debt (Udhaar) on {formatDateDDMMYYYY(reportDate)}
              </h3>
              <p className="text-xs text-slate-500">
                Lists every customer invoice, products delivered, cash received, and daily debt created.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
              Total Debt Created Today: {formatPKR(dailyDebtCreated)}
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No invoices recorded for this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-3">Customer / Shop Name</th>
                    <th className="py-3 px-3">Area</th>
                    {selectedSalesperson === 'ALL' && <th className="py-3 px-3">Salesperson</th>}
                    <th className="py-3 px-3">Products & Prices</th>
                    <th className="py-3 px-3 text-right">Bill Total (PKR)</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Cash Paid (PKR)</th>
                    <th className="py-3 px-3 text-right bg-rose-50/50 text-rose-700 font-black">
                      Today's Debt (PKR)
                    </th>
                    <th className="py-3 px-4 text-right">Customer Total Debt (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => {
                    const billTotal = order.total || order.grandTotal || 0;
                    const paid = order.paidAmount || order.amountPaid || 0;
                    const debt = Math.max(0, billTotal - paid);
                    const client = clients.find(c => c.id === order.clientId);

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono font-bold text-indigo-700 hover:underline inline-flex items-center space-x-1"
                          >
                            <span>{order.orderNumber}</span>
                            <Eye className="h-3 w-3 text-slate-400" />
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{order.clientName}</span>
                          {order.companyName && order.companyName !== order.clientName && (
                            <span className="text-[11px] text-slate-500 block">{order.companyName}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">{order.area || 'Faisalabad'}</td>
                        {selectedSalesperson === 'ALL' && (
                          <td className="py-3 px-3 font-semibold text-slate-800">{order.salesperson || 'Admin'}</td>
                        )}
                        <td className="py-3 px-3 max-w-xs">
                          <div className="space-y-1">
                            {(order.items || []).map((it, idx) => (
                              <div
                                key={idx}
                                className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 flex justify-between"
                              >
                                <span className="font-medium truncate max-w-[130px]">{it.productName}</span>
                                <span className="text-slate-500 font-mono shrink-0 ml-1">
                                  {it.quantity} x {formatPKR(it.unitPrice || it.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatPKR(billTotal)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          {formatPKR(paid)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-rose-600 bg-rose-50/30 text-xs sm:text-sm">
                          {debt > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">
                              {formatPKR(debt)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">Full Cash</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {formatPKR(client?.currentBalance || debt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                    <td colSpan={selectedSalesperson === 'ALL' ? 5 : 4} className="py-3 px-4 text-right">
                      Total Invoices:
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-700 font-black">
                      {formatPKR(totalSales)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-black">
                      {formatPKR(cashCollected)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 font-black text-sm">
                      {formatPKR(dailyDebtCreated)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 3: COMPARE ALL SALESPEOPLE (EACH SALESPERSON REQUIRED) */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Salesperson Comparison & Daily Debt Sheet ({formatDateDDMMYYYY(reportDate)})
            </h3>
            <p className="text-xs text-slate-500">
              Compare sales, cash collected, and daily debt created by each salesperson today.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Salesperson Name</th>
                  <th className="py-3 px-3">Assigned Route</th>
                  <th className="py-3 px-3 text-center">Orders</th>
                  <th className="py-3 px-3 text-right">Total Sales (PKR)</th>
                  <th className="py-3 px-3 text-right text-emerald-700">Cash Received (PKR)</th>
                  <th className="py-3 px-3 text-right bg-rose-50/50 text-rose-700 font-black">
                    Today's Debt (PKR)
                  </th>
                  <th className="py-3 px-3 text-right">Debt %</th>
                  <th className="py-3 px-3 text-right">Total Market Debt (PKR)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMetrics.map(sp => {
                  const isCurrent = selectedSalesperson === sp.name;
                  return (
                    <tr key={sp.name} className={`hover:bg-slate-50 transition ${isCurrent ? 'bg-indigo-50/40' : ''}`}>
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{sp.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded text-[9px] uppercase">
                            Selected
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{sp.route}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{sp.ordersCount}</td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-700">{formatPKR(sp.sales)}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">{formatPKR(sp.cash)}</td>
                      <td className="py-3 px-3 text-right font-black text-rose-600 bg-rose-50/30">
                        {formatPKR(sp.debt)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700">
                        {sp.debtPercent.toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatPKR(sp.totalMarketDebt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedSalesperson(sp.name);
                            setActiveTab('products');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-[11px] font-semibold transition"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                  <td colSpan={2} className="py-3 px-4 text-right">
                    Combined Fleet Total:
                  </td>
                  <td className="py-3 px-3 text-center">
                    {teamMetrics.reduce((sum, sp) => sum + sp.ordersCount, 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-indigo-700 font-black">
                    {formatPKR(teamMetrics.reduce((sum, sp) => sum + sp.sales, 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 font-black">
                    {formatPKR(teamMetrics.reduce((sum, sp) => sum + sp.cash, 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-600 font-black">
                    {formatPKR(teamMetrics.reduce((sum, sp) => sum + sp.debt, 0))}
                  </td>
                  <td></td>
                  <td className="py-3 px-3 text-right text-slate-900 font-black">
                    {formatPKR(clients.reduce((sum, c) => sum + (c.currentBalance || 0), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 8. DAILY CASH HANDOVER & VERIFICATION (PRINT-FRIENDLY & SCREEN) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
          <Coins className="h-4 w-4 mr-2 text-indigo-600" />
          End of Day Reconciliation & Verification
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-6">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block">1. Total Sale Invoices:</span>
            <span className="text-lg font-bold text-slate-900 block mt-0.5">{formatPKR(totalSales)}</span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-emerald-800 block">2. Cash Handover to Cashier:</span>
            <span className="text-lg font-bold text-emerald-700 block mt-0.5">{formatPKR(cashCollected)}</span>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
            <span className="text-rose-800 block">3. Market Debt (Udhaar) Approved:</span>
            <span className="text-lg font-bold text-rose-700 block mt-0.5">{formatPKR(dailyDebtCreated)}</span>
          </div>
        </div>

        {/* Verification Signatures */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-6">
            <div className="border-b border-slate-400 pb-1 font-semibold text-slate-700">
              {selectedSalesperson === 'ALL' ? 'Salesperson' : selectedSalesperson}
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Salesperson Signature</span>
          </div>

          <div className="space-y-6">
            <div className="border-b border-slate-400 pb-1 font-semibold text-slate-700">Cash Receiving Officer</div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Cashier Signature</span>
          </div>

          <div className="space-y-6">
            <div className="border-b border-slate-400 pb-1 font-semibold text-slate-700">Manager / Admin</div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Supervisor Approval</span>
          </div>
        </div>
      </div>
    </div>
  );
}
