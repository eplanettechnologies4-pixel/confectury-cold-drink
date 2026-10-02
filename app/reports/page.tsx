'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Package,
  Users,
  CreditCard,
  Truck,
  Receipt,
  MapPin,
  Clock,
  Layers,
  Search,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate, BUSINESS_CONFIG } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

type ReportTab = 'sales' | 'purchases' | 'stock' | 'credit' | 'expenses' | 'pnl' | 'areas';

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as ReportTab) || 'sales';

  const {
    clients,
    products,
    orders,
    payments,
    purchases,
    expenses,
    areas,
    salesReturns,
    badDebts,
    expiryRecords,
    damagedStockRecords,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as ReportTab;
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  const todayStr = getTodayKarachiDate();

  // Helper date filter
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  // Filtered Datasets
  const filteredOrders = orders.filter(o => o.status !== 'Cancelled' && (!startDate || isDateInRange(o.date || o.orderDate)));
  const filteredPurchases = purchases.filter(p => p.status === 'Posted' && (!startDate || isDateInRange(p.purchaseDate)));
  const filteredExpenses = expenses.filter(e => e.status === 'Posted' && (!startDate || isDateInRange(e.date)));
  const filteredPayments = payments.filter(p => !startDate || isDateInRange(p.date || p.paymentDate));

  // Calculations
  const totalSalesRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || o.grandTotal), 0);
  const totalPurchasesCost = filteredPurchases.reduce((sum, p) => sum + (p.total || p.grandTotal), 0);
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCollectionsAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalMarketCredit = clients.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalStockCostValuation = products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = '';
    const nowStr = new Date().toISOString().split('T')[0];

    if (activeTab === 'sales') {
      csv = 'Invoice #,Date,Customer,Area,Payment Method,Net Total (PKR),Paid (PKR),Credit (PKR)\n' +
        filteredOrders
          .map(
            o =>
              `"${o.orderNumber}","${o.date || o.orderDate}","${o.clientName.replace(/"/g, '""')}","${o.area || 'Madina Town'}","${o.paymentMethod}",${o.total || o.grandTotal},${o.paidAmount || o.amountPaid || 0},${(o.total || o.grandTotal) - (o.paidAmount || o.amountPaid || 0)}`
          )
          .join('\n');
    } else if (activeTab === 'purchases') {
      csv = 'Purchase #,Date,Supplier,Payment Status,Invoice Total (PKR),Amount Paid (PKR),Balance (PKR)\n' +
        filteredPurchases
          .map(
            p =>
              `"${p.invoiceNumber}","${p.purchaseDate}","${p.supplierName.replace(/"/g, '""')}","${p.paymentStatus}",${p.total},${p.amountPaid},${p.remainingPayable}`
          )
          .join('\n');
    } else if (activeTab === 'stock') {
      csv = 'SKU,Product Name,Category,Unit,Current Stock,Min Level,Cost Price (PKR),Selling Price (PKR),Total Cost Value (PKR)\n' +
        products
          .map(
            p =>
              `"${p.sku}","${p.name.replace(/"/g, '""')}","${p.category}","${p.unit}",${p.currentStock},${p.minStockLevel},${p.costPrice},${p.sellingPrice},${p.currentStock * p.costPrice}`
          )
          .join('\n');
    } else if (activeTab === 'credit') {
      csv = 'Customer Name,Area,Category,Phone,Opening Balance,Total Sales,Total Collected,Outstanding Balance (PKR),Credit Limit\n' +
        clients
          .map(
            c =>
              `"${c.name.replace(/"/g, '""')}","${c.area || 'Madina Town'}","${c.partyCategory || 'B'}","${c.phone}",${c.openingBalance || 0},${c.totalPurchases || 0},${c.totalPaid || 0},${c.currentBalance || 0},${c.creditLimit || 0}`
          )
          .join('\n');
    } else if (activeTab === 'expenses') {
      csv = 'Expense #,Date,Category,Description,Amount (PKR),Payment Method,Paid To,Area,Recorded By\n' +
        filteredExpenses
          .map(
            e =>
              `"${e.expenseNumber}","${e.date}","${e.category}","${e.description.replace(/"/g, '""')}",${e.amount},"${e.paymentMethod}","${e.paidTo.replace(/"/g, '""')}","${e.area || 'General'}","${e.recordedBy}"`
          )
          .join('\n');
    } else if (activeTab === 'areas') {
      csv = 'Area Name,Retailers Count,Assigned Route\n' +
        areas
          .map(a => {
            const count = clients.filter(c => c.area === a.name).length;
            return `"${a.name}",${count},"${a.assignedSalesperson || 'General Route'}"`;
          })
          .join('\n');
    } else {
      csv = 'Metric,Value (PKR)\n' +
        `Gross Sales,${totalSalesRevenue}\n` +
        `Purchases,${totalPurchasesCost}\n` +
        `Operational Expenses,${totalExpensesAmount}\n` +
        `Market Credit,${totalMarketCredit}\n` +
        `Inventory Valuation,${totalStockCostValuation}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ahmad_Traders_${activeTab.toUpperCase()}_Report_${nowStr}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Screen Only */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Business Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete management reporting suite for confectionery & cold drinks distribution across Faisalabad.
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
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Letterhead */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{BUSINESS_CONFIG.name}</h2>
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{BUSINESS_CONFIG.subtitle}</p>
            <p className="text-xs text-slate-600 mt-1">{BUSINESS_CONFIG.address}</p>
            <p className="text-xs text-slate-600 font-mono">
              Phone: {BUSINESS_CONFIG.phones[0]} / {BUSINESS_CONFIG.phones[1]}
            </p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider inline-block">
              {activeTab.toUpperCase()} REPORT
            </span>
            <p className="text-xs text-slate-500 mt-1">Generated: {formatDateDDMMYYYY(todayStr)}</p>
            {(startDate || endDate) && (
              <p className="text-xs text-slate-600">
                Filter: {startDate ? formatDateDDMMYYYY(startDate) : 'Start'} to {endDate ? formatDateDDMMYYYY(endDate) : 'Present'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation (7 Tabs) - Screen Only */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-xs overflow-x-auto no-print">
        <div className="flex space-x-1 p-2 min-w-max">
          {[
            { id: 'sales', label: 'Sales Reports', icon: TrendingUp },
            { id: 'purchases', label: 'Purchase Reports', icon: Truck },
            { id: 'stock', label: 'Stock Reports', icon: Package },
            { id: 'credit', label: 'Credit Reports', icon: CreditCard },
            { id: 'expenses', label: 'Expense Reports', icon: Receipt },
            { id: 'pnl', label: 'P&L Reports', icon: Layers },
            { id: 'areas', label: 'Area Reports', icon: MapPin },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center space-x-2 transition ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar - Screen Only */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-2"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search within report..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* TAB 1: SALES REPORT */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Sales Revenue</span>
              <span className="text-2xl font-extrabold text-indigo-700 mt-1 block">{formatPKR(totalSalesRevenue)}</span>
              <span className="text-[11px] text-slate-500">{filteredOrders.length} wholesale invoices</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Cash Collected at Sale</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                {formatPKR(filteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0))}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">Immediate cash inflow</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Credit Created</span>
              <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
                {formatPKR(filteredOrders.reduce((sum, o) => sum + ((o.total || o.grandTotal) - (o.paidAmount || o.amountPaid || 0)), 0))}
              </span>
              <span className="text-[11px] text-rose-600 font-medium">Market receivables added</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Area</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3 text-right">Net Total (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Paid (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Credit (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{formatDateDDMMYYYY(o.date || o.orderDate)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{o.clientName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{o.area || 'Madina Town'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatPKR(o.total || o.grandTotal)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">{formatPKR(o.paidAmount || o.amountPaid || 0)}</td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">
                        {formatPKR((o.total || o.grandTotal) - (o.paidAmount || o.amountPaid || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs text-slate-900">
                    <td colSpan={5} className="py-2.5 px-3 text-right">Total:</td>
                    <td className="py-2.5 px-3 text-right text-indigo-700">{formatPKR(totalSalesRevenue)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600">
                      {formatPKR(filteredOrders.reduce((sum, o) => sum + (o.paidAmount || o.amountPaid || 0), 0))}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-600">
                      {formatPKR(filteredOrders.reduce((sum, o) => sum + ((o.total || o.grandTotal) - (o.paidAmount || o.amountPaid || 0)), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE REPORT */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Purchases</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{formatPKR(totalPurchasesCost)}</span>
              <span className="text-[11px] text-slate-500">{filteredPurchases.length} consignments</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Amount Paid to Suppliers</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {formatPKR(filteredPurchases.reduce((sum, p) => sum + p.amountPaid, 0))}
              </span>
              <span className="text-[11px] text-slate-500">Paid out via cash/bank</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Remaining Payable Balance</span>
              <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                {formatPKR(filteredPurchases.reduce((sum, p) => sum + p.remainingPayable, 0))}
              </span>
              <span className="text-[11px] text-amber-600 font-medium">Trade payables liability</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Purchase #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Payment Status</th>
                    <th className="py-2.5 px-3 text-right">Invoice Total (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Paid (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Payable (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{formatDateDDMMYYYY(p.purchaseDate)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{p.supplierName}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatPKR(p.total)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">{formatPKR(p.amountPaid)}</td>
                      <td className="py-2.5 px-3 text-right text-amber-600 font-semibold">{formatPKR(p.remainingPayable)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK VALUATION REPORT */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Inventory Valuation (Cost)</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{formatPKR(totalStockCostValuation)}</span>
              <span className="text-[11px] text-slate-500">Asset cost basis</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Catalog Items</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{products.length} SKUs</span>
              <span className="text-[11px] text-slate-500">Confectionery & Cold Drinks</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Low Stock Alert</span>
              <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                {products.filter(p => p.currentStock <= p.minStockLevel).length} SKUs
              </span>
              <span className="text-[11px] text-amber-600 font-medium">Reorder recommended</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">In Stock</th>
                    <th className="py-2.5 px-3 text-right">Cost Price (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Retail Price (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Total Asset Value (Cost)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.category === 'Cold Drinks' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{p.currentStock} {p.unit}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatPKR(p.costPrice)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatPKR(p.sellingPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatPKR(p.currentStock * p.costPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CREDIT REPORTS */}
      {activeTab === 'credit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Outstanding Market Credit</span>
              <span className="text-2xl font-extrabold text-rose-700 mt-1 block">{formatPKR(totalMarketCredit)}</span>
              <span className="text-[11px] text-slate-500">Retailer network receivables</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Credit Customers</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {clients.filter(c => c.currentBalance > 0).length} of {clients.length}
              </span>
              <span className="text-[11px] text-slate-500">Parties with outstanding ledger balance</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Collections Recorded</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{formatPKR(totalCollectionsAmount)}</span>
              <span className="text-[11px] text-emerald-600 font-medium">Receipts processed</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Area</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Total Purchases</th>
                    <th className="py-2.5 px-3 text-right">Total Collections</th>
                    <th className="py-2.5 px-3 text-right">Current Outstanding</th>
                    <th className="py-2.5 px-3 text-right">Credit Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-700">{c.area || 'Madina Town'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.partyCategory === 'A' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          Cat {c.partyCategory || 'B'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">{formatPKR(c.totalPurchases || 0)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">{formatPKR(c.totalPaid || 0)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">{formatPKR(c.currentBalance)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{c.creditLimit ? formatPKR(c.creditLimit) : 'No Limit'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EXPENSE REPORTS */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Period Operational Expenses</span>
              <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{formatPKR(totalExpensesAmount)}</span>
            </div>
            <span className="text-xs font-semibold text-slate-600">{filteredExpenses.length} vouchers</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Voucher #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Paid To</th>
                    <th className="py-2.5 px-3">Area / Route</th>
                    <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{e.expenseNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{formatDateDDMMYYYY(e.date)}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{e.category}</td>
                      <td className="py-2.5 px-3 text-slate-700">{e.description}</td>
                      <td className="py-2.5 px-3 text-slate-600">{e.paidTo}</td>
                      <td className="py-2.5 px-3 text-slate-600">{e.area || 'General Facility'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">{formatPKR(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: P&L REPORTS */}
      {activeTab === 'pnl' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Profit & Loss Executive Summary</h2>
              <p className="text-xs text-slate-500">Inventory costing based profit recognition</p>
            </div>
            <Link href="/finance/profit-loss" className="text-xs font-semibold text-indigo-600 hover:underline">
              View Detailed Waterfall P&L →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Gross Sales:</span>
              <span className="text-base font-bold text-slate-900 block mt-1">{formatPKR(totalSalesRevenue)}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-emerald-800 block">Operating Expenses:</span>
              <span className="text-base font-bold text-rose-600 block mt-1">{formatPKR(totalExpensesAmount)}</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-800 block">Total Market Collections:</span>
              <span className="text-base font-bold text-blue-900 block mt-1">{formatPKR(totalCollectionsAmount)}</span>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-purple-800 block">Inventory Asset Value:</span>
              <span className="text-base font-bold text-purple-900 block mt-1">{formatPKR(totalStockCostValuation)}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AREA REPORTS */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Area Name</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Assigned Salesperson / Route</th>
                  <th className="py-2.5 px-3 text-right">Retailers Count</th>
                  <th className="py-2.5 px-3 text-right">Total Market Credit</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {areas.map(a => {
                  const areaClients = clients.filter(c => c.area === a.name);
                  const areaCredit = areaClients.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{a.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{a.description || 'Faisalabad distribution sector'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{a.assignedSalesperson || 'Van Route 01'}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{areaClients.length}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">{formatPKR(areaCredit)}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
