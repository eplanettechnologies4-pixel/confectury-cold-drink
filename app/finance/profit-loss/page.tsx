'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Banknote,
  Calendar,
  Download,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
  Layers,
  MapPin,
  Package,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate, BUSINESS_CONFIG } from '@/lib/utils';
import { Product, ProductCategory } from '@/types';

export default function ProfitAndLossPage() {
  const {
    orders,
    salesReturns,
    expenses,
    badDebts,
    badDebtRecoveries,
    expiryRecords,
    damagedStockRecords,
    products,
    clients,
    areas,
    payments,
  } = useAppState();

  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [viewTab, setViewTab] = useState<'summary' | 'category' | 'product' | 'area'>('summary');

  const todayStr = getTodayKarachiDate();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Helper date filter
  const isDateInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    if (period === 'today') return d === todayStr;
    if (period === 'week') return d >= startOfWeekStr;
    if (period === 'month') return d >= startOfMonthStr;
    if (period === 'custom') {
      if (customStart && d < customStart) return false;
      if (customEnd && d > customEnd) return false;
      return true;
    }
    return true;
  };

  // 1. FILTERED TRANSACTIONS
  const periodOrders = orders.filter(o => o.status !== 'Cancelled' && isDateInPeriod(o.date || o.orderDate));
  const periodSalesReturns = salesReturns.filter(r => isDateInPeriod(r.date || r.returnDate));
  const periodExpenses = expenses.filter(e => e.status === 'Posted' && isDateInPeriod(e.date));
  const periodBadDebts = badDebts.filter(b => b.status === 'Approved' && isDateInPeriod(b.date || b.approvalDate || '2026-10-01'));
  const periodRecoveries = badDebtRecoveries.filter(r => isDateInPeriod(r.date));
  const periodExpiryLosses = expiryRecords.filter(e => e.status === 'Written Off' && isDateInPeriod(e.writtenOffAt || ''));
  const periodDamagedLosses = damagedStockRecords.filter(d => isDateInPeriod(d.date));

  // 2. REVENUE CALCULATIONS
  const grossSales = periodOrders.reduce((sum, o) => {
    const itemsGross = o.items.reduce((s, it) => s + it.quantity * (it.unitPrice || it.price || 0), 0);
    return sum + itemsGross;
  }, 0);

  const totalDiscounts = periodOrders.reduce((sum, o) => sum + (o.discountTotal || o.discount || 0), 0);
  const totalSalesReturns = periodSalesReturns.reduce((sum, r) => sum + r.refundAmount, 0);
  const netSales = Math.max(0, grossSales - totalDiscounts - totalSalesReturns);

  // 3. COST OF GOODS SOLD (COGS)
  // Accurate weighted cost for items actually sold
  let totalCOGS = 0;
  periodOrders.forEach(order => {
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId || p.sku === item.productId);
      const unitCost = prod?.costPrice || 0;
      totalCOGS += item.quantity * unitCost;
    });
  });

  // Subtract cost of goods returned back to stock
  periodSalesReturns.forEach(ret => {
    if (ret.isResalable || ret.condition === 'Good' || ret.condition === 'Resalable') {
      const prod = products.find(p => p.id === ret.productId);
      const unitCost = prod?.costPrice || 0;
      totalCOGS = Math.max(0, totalCOGS - ret.quantity * unitCost);
    }
  });

  // 4. PROFIT MARGINS
  const grossProfit = netSales - totalCOGS;
  const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

  // 5. OPERATIONAL EXPENSES
  const totalDistributionExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const operatingProfit = grossProfit - totalDistributionExpenses;

  // 6. LOSSES & WRITE-OFFS
  const totalBadDebtExpense = periodBadDebts.reduce((sum, b) => sum + b.writeOffAmount, 0);
  const totalBadDebtRecovery = periodRecoveries.reduce((sum, r) => sum + r.amount, 0);
  const netBadDebtImpact = totalBadDebtExpense - totalBadDebtRecovery;

  const totalExpiryLoss = periodExpiryLosses.reduce((sum, e) => sum + e.quantity * e.purchaseCost, 0);
  const totalDamageLoss = periodDamagedLosses.reduce((sum, d) => sum + d.totalLoss, 0);
  const totalStockLosses = totalExpiryLoss + totalDamageLoss;

  // 7. NET PROFIT BEFORE TAX
  const netProfit = operatingProfit - netBadDebtImpact - totalStockLosses;
  const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

  // 8. CATEGORY-WISE BREAKDOWN (Cold Drinks vs Confectionery)
  const categoryData: Record<
    ProductCategory,
    { grossSales: number; discounts: number; returns: number; netSales: number; cogs: number; grossProfit: number }
  > = {
    'Cold Drinks': { grossSales: 0, discounts: 0, returns: 0, netSales: 0, cogs: 0, grossProfit: 0 },
    Confectionery: { grossSales: 0, discounts: 0, returns: 0, netSales: 0, cogs: 0, grossProfit: 0 },
  };

  periodOrders.forEach(o => {
    o.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId || p.sku === it.productId);
      const cat: ProductCategory = prod?.category === 'Confectionery' ? 'Confectionery' : 'Cold Drinks';
      const itemPrice = it.unitPrice || it.price || 0;
      const itemSubtotal = it.quantity * itemPrice;
      const itemCost = it.quantity * (prod?.costPrice || 0);

      categoryData[cat].grossSales += itemSubtotal;
      categoryData[cat].cogs += itemCost;
    });
  });

  periodSalesReturns.forEach(r => {
    const prod = products.find(p => p.id === r.productId);
    const cat: ProductCategory = prod?.category === 'Confectionery' ? 'Confectionery' : 'Cold Drinks';
    categoryData[cat].returns += r.refundAmount;
    if (r.isResalable || r.condition === 'Good' || r.condition === 'Resalable') {
      categoryData[cat].cogs = Math.max(0, categoryData[cat].cogs - r.quantity * (prod?.costPrice || 0));
    }
  });

  (['Cold Drinks', 'Confectionery'] as ProductCategory[]).forEach(cat => {
    categoryData[cat].netSales = Math.max(0, categoryData[cat].grossSales - categoryData[cat].returns);
    categoryData[cat].grossProfit = categoryData[cat].netSales - categoryData[cat].cogs;
  });

  // 9. PRODUCT-WISE BREAKDOWN
  const productPerformance: Record<
    string,
    { id: string; name: string; category: string; unitsSold: number; netSales: number; cogs: number; profit: number }
  > = {};

  products.forEach(p => {
    productPerformance[p.id] = {
      id: p.id,
      name: p.name,
      category: p.category,
      unitsSold: 0,
      netSales: 0,
      cogs: 0,
      profit: 0,
    };
  });

  periodOrders.forEach(o => {
    o.items.forEach(it => {
      const pid = it.productId;
      if (productPerformance[pid]) {
        const itemPrice = it.unitPrice || it.price || 0;
        const itemGross = it.quantity * itemPrice;
        const itemCost = it.quantity * (products.find(p => p.id === pid)?.costPrice || 0);
        productPerformance[pid].unitsSold += it.quantity;
        productPerformance[pid].netSales += itemGross;
        productPerformance[pid].cogs += itemCost;
        productPerformance[pid].profit += itemGross - itemCost;
      }
    });
  });

  // 10. AREA-WISE BREAKDOWN
  const areaPerformance = areas.map(area => {
    const areaClients = clients.filter(c => c.area === area.name);
    const areaClientIds = new Set(areaClients.map(c => c.id));

    const areaOrders = periodOrders.filter(o => areaClientIds.has(o.clientId));
    const areaReturns = periodSalesReturns.filter(r => areaClientIds.has(r.clientId));

    const areaGross = areaOrders.reduce((sum, o) => sum + (o.total || o.grandTotal), 0);
    const areaRet = areaReturns.reduce((sum, r) => sum + r.refundAmount, 0);
    const areaNet = Math.max(0, areaGross - areaRet);

    const areaCash = areaOrders
      .filter(o => o.paymentMethod === 'Cash')
      .reduce((sum, o) => sum + (o.paidAmount || o.amountPaid || 0), 0);
    const areaCredit = areaOrders
      .filter(o => o.paymentMethod === 'Credit' || o.paymentMethod === 'Credit Account' || o.paymentMethod === 'Partial Cash/Credit')
      .reduce((sum, o) => sum + ((o.total || o.grandTotal) - (o.paidAmount || o.amountPaid || 0)), 0);

    const areaPayments = payments.filter(
      p => areaClientIds.has(p.clientId) && isDateInPeriod(p.date || p.paymentDate)
    );
    const areaCollections = areaPayments.reduce((sum, p) => sum + p.amount, 0);

    const areaOutstanding = areaClients.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
    const areaExpenses = periodExpenses.filter(e => e.area === area.name).reduce((sum, e) => sum + e.amount, 0);

    return {
      areaName: area.name,
      customerCount: areaClients.length,
      grossSales: areaGross,
      returns: areaRet,
      netSales: areaNet,
      cashSales: areaCash,
      creditSales: areaCredit,
      collections: areaCollections,
      outstandingCredit: areaOutstanding,
      assignedExpenses: areaExpenses,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Profit & Loss Statement</h1>
          <p className="text-xs text-slate-500 mt-1">
            Realized COGS accounting for confectionery & beverages. Unsold inventory is not treated as an expense.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Download className="h-4 w-4" />
          <span>Print / Export P&L</span>
        </button>
      </div>

      {/* Period Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Period:</span>
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
            { id: 'custom', label: 'Custom Range' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === p.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}

          {period === 'custom' && (
            <div className="flex items-center space-x-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setViewTab('summary')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            viewTab === 'summary'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Statement of Profit & Loss</span>
        </button>
        <button
          onClick={() => setViewTab('category')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            viewTab === 'category'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Category Profitability</span>
        </button>
        <button
          onClick={() => setViewTab('product')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            viewTab === 'product'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Product Profitability</span>
        </button>
        <button
          onClick={() => setViewTab('area')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            viewTab === 'area'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Area Financials</span>
        </button>
      </div>

      {/* VIEW 1: STATEMENT OF PROFIT & LOSS */}
      {viewTab === 'summary' && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Net Revenue</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{formatPKR(netSales)}</span>
              <span className="text-[11px] text-slate-500">{periodOrders.length} sales orders</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">Gross Profit</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{formatPKR(grossProfit)}</span>
              <span className="text-[11px] text-emerald-600 font-semibold">{grossMarginPct.toFixed(1)}% Gross Margin</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider block">Total Operating Expenses</span>
              <span className="text-2xl font-extrabold text-rose-700 mt-1 block">{formatPKR(totalDistributionExpenses)}</span>
              <span className="text-[11px] text-rose-600 font-medium">Fleet & Warehouse</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
              <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider block">Net Profit</span>
              <span className={`text-2xl font-extrabold mt-1 block ${netProfit >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
                {formatPKR(netProfit)}
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold">{netMarginPct.toFixed(1)}% Net Margin</span>
            </div>
          </div>

          {/* Detailed Waterfall P&L Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Income Statement (P&L Waterfall)</h2>
                <p className="text-xs text-slate-500">Ahmad Traders • Faisalabad Distribution Operations</p>
              </div>
              <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-mono font-bold">
                Currency: PKR
              </span>
            </div>

            <table className="w-full text-xs border-collapse">
              <tbody>
                {/* 1. REVENUE SECTION */}
                <tr className="bg-slate-50/50 font-bold text-slate-700 border-b border-slate-100">
                  <td className="py-2.5 px-4 uppercase tracking-wider text-[11px]">1. Operating Revenue</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-6 text-slate-700">Gross Distribution Sales</td>
                  <td className="py-2 px-4 text-right text-slate-900 font-medium">{formatPKR(grossSales)}</td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50 text-slate-500">
                  <td className="py-2 px-6">Less: Customer Discounts</td>
                  <td className="py-2 px-4 text-right text-rose-600 font-medium">({formatPKR(totalDiscounts)})</td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50 text-slate-500">
                  <td className="py-2 px-6">Less: Sales Returns & Credit Notes</td>
                  <td className="py-2 px-4 text-right text-rose-600 font-medium">({formatPKR(totalSalesReturns)})</td>
                  <td></td>
                </tr>
                <tr className="bg-slate-50 font-bold border-t border-b border-slate-200">
                  <td className="py-2.5 px-4 text-slate-900">Net Sales Revenue</td>
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-extrabold text-slate-900 text-sm">{formatPKR(netSales)}</td>
                </tr>

                {/* 2. COGS SECTION */}
                <tr className="bg-slate-50/50 font-bold text-slate-700 border-b border-slate-100">
                  <td className="py-2.5 px-4 uppercase tracking-wider text-[11px] pt-4">2. Cost of Goods Sold</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-6 text-slate-700">Cost of Goods Sold (Realized Product Cost)</td>
                  <td className="py-2 px-4 text-right text-slate-900 font-medium">{formatPKR(totalCOGS)}</td>
                  <td></td>
                </tr>
                <tr className="bg-emerald-50/40 font-bold border-t border-b border-emerald-100">
                  <td className="py-2.5 px-4 text-emerald-900">
                    Gross Profit <span className="text-[11px] font-normal text-emerald-700">({grossMarginPct.toFixed(1)}% margin)</span>
                  </td>
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-extrabold text-emerald-700 text-sm">{formatPKR(grossProfit)}</td>
                </tr>

                {/* 3. OPERATING EXPENSES */}
                <tr className="bg-slate-50/50 font-bold text-slate-700 border-b border-slate-100">
                  <td className="py-2.5 px-4 uppercase tracking-wider text-[11px] pt-4">3. Distribution & Operating Expenses</td>
                  <td></td>
                  <td></td>
                </tr>
                {periodExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 text-slate-600">
                    <td className="py-1.5 px-6">
                      {exp.category} — {exp.description} {exp.area && <span className="text-[10px] text-slate-400">({exp.area})</span>}
                    </td>
                    <td className="py-1.5 px-4 text-right text-slate-700 font-medium">{formatPKR(exp.amount)}</td>
                    <td></td>
                  </tr>
                ))}
                {periodExpenses.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-2 px-6 text-slate-400 italic">No operational expenses logged in period</td>
                    <td></td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold border-t border-b border-slate-200">
                  <td className="py-2.5 px-4 text-slate-900">Operating Profit (EBITDA equivalent)</td>
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-extrabold text-slate-900 text-sm">{formatPKR(operatingProfit)}</td>
                </tr>

                {/* 4. INVENTORY LOSSES & CREDIT WRITE-OFFS */}
                <tr className="bg-slate-50/50 font-bold text-slate-700 border-b border-slate-100">
                  <td className="py-2.5 px-4 uppercase tracking-wider text-[11px] pt-4">4. Losses, Expiry & Bad Debts</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50 text-slate-600">
                  <td className="py-2 px-6">Expired Stock Write-offs (Loss)</td>
                  <td className="py-2 px-4 text-right text-rose-600 font-medium">{totalExpiryLoss > 0 ? `(${formatPKR(totalExpiryLoss)})` : '—'}</td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50 text-slate-600">
                  <td className="py-2 px-6">Damaged Goods / Transit Breakage</td>
                  <td className="py-2 px-4 text-right text-rose-600 font-medium">{totalDamageLoss > 0 ? `(${formatPKR(totalDamageLoss)})` : '—'}</td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50 text-slate-600">
                  <td className="py-2 px-6">Approved Bad Debt Write-offs</td>
                  <td className="py-2 px-4 text-right text-rose-600 font-medium">{totalBadDebtExpense > 0 ? `(${formatPKR(totalBadDebtExpense)})` : '—'}</td>
                  <td></td>
                </tr>
                {totalBadDebtRecovery > 0 && (
                  <tr className="hover:bg-slate-50 text-emerald-700">
                    <td className="py-2 px-6">Add: Bad Debt Recoveries</td>
                    <td className="py-2 px-4 text-right font-medium">+{formatPKR(totalBadDebtRecovery)}</td>
                    <td></td>
                  </tr>
                )}

                {/* 5. NET PROFIT */}
                <tr className="bg-indigo-50 border-t-2 border-indigo-300 font-extrabold text-sm">
                  <td className="py-3 px-4 text-indigo-950">
                    NET PROFIT BEFORE TAX <span className="text-xs font-normal text-indigo-700">({netMarginPct.toFixed(1)}% net margin)</span>
                  </td>
                  <td></td>
                  <td className={`py-3 px-4 text-right text-base ${netProfit >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
                    {formatPKR(netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CATEGORY PROFITABILITY */}
      {viewTab === 'category' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['Cold Drinks', 'Confectionery'] as ProductCategory[]).map(cat => {
              const data = categoryData[cat];
              const margin = data.netSales > 0 ? (data.grossProfit / data.netSales) * 100 : 0;
              return (
                <div key={cat} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{cat}</h3>
                      <p className="text-xs text-slate-500">Distribution line profitability</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                      {margin.toFixed(1)}% Gross Margin
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Gross Sales:</span>
                      <span className="font-semibold text-slate-900">{formatPKR(data.grossSales)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Returns:</span>
                      <span className="text-rose-600 font-medium">({formatPKR(data.returns)})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50 font-bold">
                      <span className="text-slate-700">Net Sales:</span>
                      <span className="text-slate-900">{formatPKR(data.netSales)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Cost of Goods Sold (COGS):</span>
                      <span className="text-slate-700">{formatPKR(data.cogs)}</span>
                    </div>
                    <div className="flex justify-between py-2 pt-3 font-extrabold text-sm border-t border-slate-200 bg-emerald-50/30 px-2 rounded">
                      <span className="text-emerald-900">Gross Profit:</span>
                      <span className="text-emerald-700">{formatPKR(data.grossProfit)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: PRODUCT PROFITABILITY */}
      {viewTab === 'product' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Net Sales (PKR)</th>
                  <th className="py-3 px-4 text-right">COGS Cost (PKR)</th>
                  <th className="py-3 px-4 text-right">Gross Profit (PKR)</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.values(productPerformance).map(prod => {
                  const margin = prod.netSales > 0 ? (prod.profit / prod.netSales) * 100 : 0;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{prod.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          prod.category === 'Cold Drinks' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">{prod.unitsSold}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatPKR(prod.netSales)}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatPKR(prod.cogs)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatPKR(prod.profit)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">{margin.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: AREA FINANCIALS */}
      {viewTab === 'area' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Area / Route</th>
                  <th className="py-3 px-4 text-right">Retailers</th>
                  <th className="py-3 px-4 text-right">Gross Sales</th>
                  <th className="py-3 px-4 text-right">Returns</th>
                  <th className="py-3 px-4 text-right">Net Sales</th>
                  <th className="py-3 px-4 text-right">Cash Received</th>
                  <th className="py-3 px-4 text-right">Credit Issued</th>
                  <th className="py-3 px-4 text-right">Collections</th>
                  <th className="py-3 px-4 text-right">Market Debt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {areaPerformance.map(ap => (
                  <tr key={ap.areaName} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{ap.areaName}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{ap.customerCount}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatPKR(ap.grossSales)}</td>
                    <td className="py-3 px-4 text-right text-rose-600">({formatPKR(ap.returns)})</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatPKR(ap.netSales)}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{formatPKR(ap.cashSales)}</td>
                    <td className="py-3 px-4 text-right text-indigo-700">{formatPKR(ap.creditSales)}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatPKR(ap.collections)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">{formatPKR(ap.outstandingCredit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
