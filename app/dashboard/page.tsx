'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Coins,
  Package,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight,
  Plus,
  ShoppingCart,
  Receipt,
  Download,
  Clock,
  Truck,
  Building2,
  Layers,
  MapPin,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate, BUSINESS_CONFIG } from '@/lib/utils';
import { ProductCategory } from '@/types';

export default function DashboardPage() {
  const {
    currentUser,
    clients,
    products,
    orders,
    payments,
    purchases,
    expenses,
    suppliers,
    expiryRecords,
    areas,
  } = useAppState();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const todayStr = getTodayKarachiDate();

  // Helper date calculations
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const isDateSelected = (dateStr: string) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    if (dateFilter === 'today') return d === todayStr;
    if (dateFilter === 'yesterday') return d === yesterdayStr;
    if (dateFilter === 'week') return d >= startOfWeekStr;
    if (dateFilter === 'month') return d >= startOfMonthStr;
    if (dateFilter === 'custom') {
      if (customStart && d < customStart) return false;
      if (customEnd && d > customEnd) return false;
      return true;
    }
    return true;
  };

  // 1. FILTERED AGGREGATES
  const periodOrders = orders.filter(o => o.status !== 'Cancelled' && isDateSelected(o.date || o.orderDate));
  const periodPurchases = purchases.filter(p => p.status === 'Posted' && isDateSelected(p.purchaseDate));
  const periodPayments = payments.filter(p => isDateSelected(p.date || p.paymentDate));
  const periodExpenses = expenses.filter(e => e.status === 'Posted' && isDateSelected(e.date));

  // Today specific (for Today's cards)
  const todayOrders = orders.filter(o => o.status !== 'Cancelled' && (o.date || o.orderDate) === todayStr);
  const todayPurchases = purchases.filter(p => p.status === 'Posted' && p.purchaseDate === todayStr);
  const todayPayments = payments.filter(p => (p.date || p.paymentDate) === todayStr);
  const todayExpenses = expenses.filter(e => e.status === 'Posted' && e.date === todayStr);

  const todaySalesVal = todayOrders.reduce((acc, o) => acc + (o.total || o.grandTotal), 0);
  const todayPurchasesVal = todayPurchases.reduce((acc, p) => acc + (p.total || p.grandTotal), 0);
  const todayCollectionsVal = todayPayments.reduce((acc, p) => acc + p.amount, 0);
  const todayExpensesVal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Today's Profit: Today's Net Sales - Today's COGS - Today's Expenses
  let todayCOGS = 0;
  todayOrders.forEach(o => {
    o.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId || p.sku === it.productId);
      todayCOGS += it.quantity * (prod?.costPrice || 0);
    });
  });
  const todayProfit = todaySalesVal - todayCOGS - todayExpensesVal;

  // Standalone Balance Sheet Metrics
  const currentStockCostVal = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const currentStockRetailVal = products.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
  const totalMarketCredit = clients.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  const totalSupplierPayables = suppliers.reduce((acc, s) => acc + (s.currentPayable || 0), 0);

  // Expiry & Stock Metrics
  const todayDateObj = new Date();
  todayDateObj.setHours(0, 0, 0, 0);

  const expiredCount = expiryRecords.filter(r => {
    if (r.status === 'Written Off') return false;
    const exp = new Date(r.expiryDate);
    exp.setHours(0, 0, 0, 0);
    return exp.getTime() < todayDateObj.getTime();
  }).length;

  const expiringSoonCount = expiryRecords.filter(r => {
    if (r.status === 'Written Off') return false;
    const exp = new Date(r.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diff = Math.ceil((exp.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  }).length;

  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockLevel).length;
  const activeCustomersCount = clients.filter(c => c.status === 'Active' || !c.status).length;

  // Today's Sales by Category
  let todayColdDrinksSales = 0;
  let todayConfectionerySales = 0;

  todayOrders.forEach(o => {
    o.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId || p.sku === it.productId);
      const itemPrice = it.unitPrice || it.price || 0;
      if (prod?.category === 'Cold Drinks') todayColdDrinksSales += it.quantity * itemPrice;
      else todayConfectionerySales += it.quantity * itemPrice;
    });
  });

  // Today's Sales by Area
  const todaySalesByArea: Record<string, number> = {};
  areas.forEach(a => {
    todaySalesByArea[a.name] = 0;
  });

  todayOrders.forEach(o => {
    const cl = clients.find(c => c.id === o.clientId);
    const areaName = cl?.area || 'Madina Town';
    todaySalesByArea[areaName] = (todaySalesByArea[areaName] || 0) + (o.total || o.grandTotal);
  });

  // 2. DYNAMIC TIMELINE CHART DATA
  // Generate daily points for the last 7 days or month
  const timelineData = useMemo(() => {
    const days = 7;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Daily orders
      const dayOrders = orders.filter(o => o.status !== 'Cancelled' && (o.date || o.orderDate) === dStr);
      const daySales = dayOrders.reduce((sum, o) => sum + (o.total || o.grandTotal), 0);

      // Daily COGS
      let dayCOGS = 0;
      dayOrders.forEach(o => {
        o.items.forEach(it => {
          const prod = products.find(p => p.id === it.productId || p.sku === it.productId);
          dayCOGS += it.quantity * (prod?.costPrice || 0);
        });
      });

      // Daily purchases
      const dayPurchases = purchases
        .filter(p => p.status === 'Posted' && p.purchaseDate === dStr)
        .reduce((sum, p) => sum + (p.total || p.grandTotal), 0);

      // Daily collections
      const dayCollections = payments
        .filter(p => (p.date || (p as any).paymentDate) === dStr)
        .reduce((sum, p) => sum + p.amount, 0);

      // Daily expenses
      const dayExpenses = expenses
        .filter(e => e.status === 'Posted' && e.date === dStr)
        .reduce((sum, e) => sum + e.amount, 0);

      // Daily profit
      const dayProfit = daySales - dayCOGS - dayExpenses;

      result.push({
        date: dayLabel,
        sales: daySales,
        purchases: dayPurchases,
        collections: dayCollections,
        expenses: dayExpenses,
        profit: dayProfit,
      });
    }
    return result;
  }, [orders, purchases, payments, expenses, products]);

  // Area distribution for Bar Chart
  const areaChartData = areas.map(a => {
    const areaClients = clients.filter(c => c.area === a.name);
    const clientIds = new Set(areaClients.map(c => c.id));
    const totalSales = orders
      .filter(o => o.status !== 'Cancelled' && clientIds.has(o.clientId))
      .reduce((sum, o) => sum + (o.total || o.grandTotal), 0);

    return {
      name: a.name,
      sales: totalSales,
      customers: areaClients.length,
    };
  });

  // Category distribution for Pie Chart
  const categoryChartData = [
    { name: 'Cold Drinks', value: todayColdDrinksSales || 1, color: '#3b82f6' },
    { name: 'Confectionery', value: todayConfectionerySales || 1, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{BUSINESS_CONFIG.name}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
              Live Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {BUSINESS_CONFIG.subtitle} • {BUSINESS_CONFIG.address}
          </p>
        </div>

        {/* Global Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/orders/new"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>New Sale</span>
          </Link>
          <Link
            href="/purchases/new"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Truck className="h-4 w-4" />
            <span>New Purchase</span>
          </Link>
          <Link
            href="/accounts/payments"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Coins className="h-4 w-4" />
            <span>Record Collection</span>
          </Link>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Date Filter:</span>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setDateFilter(p.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                dateFilter === p.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}

          {dateFilter === 'custom' && (
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

        <div className="text-xs text-slate-500 font-mono">
          Faisalabad Timezone: <span className="font-semibold text-slate-800">PKT (UTC+5)</span>
        </div>
      </div>

      {/* TODAY'S CORE DISTRIBUTION KPIS (5 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-900">Today&apos;s Sales</span>
            <ShoppingCart className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-indigo-950 mt-2">{formatPKR(todaySalesVal)}</p>
          <p className="text-[11px] text-indigo-700 mt-1">{todayOrders.length} wholesale orders</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Today&apos;s Purchases</span>
            <Truck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-950 mt-2">{formatPKR(todayPurchasesVal)}</p>
          <p className="text-[11px] text-emerald-700 mt-1">{todayPurchases.length} consignments received</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900">Today&apos;s Collections</span>
            <Coins className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-blue-950 mt-2">{formatPKR(todayCollectionsVal)}</p>
          <p className="text-[11px] text-blue-700 mt-1">{todayPayments.length} customer receipts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">Today&apos;s Expenses</span>
            <TrendingUp className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-rose-950 mt-2">{formatPKR(todayExpensesVal)}</p>
          <p className="text-[11px] text-rose-700 mt-1">{todayExpenses.length} operational vouchers</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900">Today&apos;s Profit</span>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <p className={`text-xl font-extrabold mt-2 ${todayProfit >= 0 ? 'text-purple-950' : 'text-rose-600'}`}>
            {formatPKR(todayProfit)}
          </p>
          <p className="text-[11px] text-purple-700 mt-1">Realized Net Margin</p>
        </div>
      </div>

      {/* BALANCE SHEET & POSITION KPIS (8 METRICS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block truncate">Stock Value (Cost)</span>
          <span className="text-sm font-bold text-slate-900 block mt-1">{formatPKR(currentStockCostVal)}</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block truncate">Market Credit</span>
          <span className="text-sm font-bold text-indigo-700 block mt-1">{formatPKR(totalMarketCredit)}</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block truncate">Supplier Payables</span>
          <span className="text-sm font-bold text-amber-700 block mt-1">{formatPKR(totalSupplierPayables)}</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block truncate">Active Retailers</span>
          <span className="text-sm font-bold text-emerald-700 block mt-1">{activeCustomersCount} Parties</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block truncate">Low Stock SKUs</span>
          <span className="text-sm font-bold text-amber-600 block mt-1">{lowStockCount} Products</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block truncate">Expired Batches</span>
          <span className="text-sm font-bold text-rose-600 block mt-1">{expiredCount} Batches</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block truncate">Expiring ≤30d</span>
          <span className="text-sm font-bold text-amber-500 block mt-1">{expiringSoonCount} Batches</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block truncate">Est. Retail Value</span>
          <span className="text-sm font-bold text-slate-900 block mt-1">{formatPKR(currentStockRetailVal)}</span>
        </div>
      </div>

      {/* TODAY'S SALES BREAKDOWNS: BY CATEGORY & BY AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today&apos;s Sales by Product Category</h2>
              <p className="text-[11px] text-slate-500">Strictly Confectionery and Cold Drinks distribution</p>
            </div>
            <span className="text-xs font-bold text-slate-800">
              Total: {formatPKR(todayColdDrinksSales + todayConfectionerySales)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200">
              <span className="text-xs font-semibold text-blue-900 block">Cold Drinks</span>
              <span className="text-lg font-extrabold text-blue-950 block mt-1">{formatPKR(todayColdDrinksSales)}</span>
              <span className="text-[10px] text-blue-700">Beverages & Sodas</span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
              <span className="text-xs font-semibold text-amber-900 block">Confectionery</span>
              <span className="text-lg font-extrabold text-amber-950 block mt-1">{formatPKR(todayConfectionerySales)}</span>
              <span className="text-[10px] text-amber-700">Chocolates, Candies & Biscuits</span>
            </div>
          </div>
        </div>

        {/* Area breakdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today&apos;s Sales by Faisalabad Area</h2>
              <p className="text-[11px] text-slate-500">Geographic route sales performance</p>
            </div>
            <Link href="/sales/area" className="text-xs text-indigo-600 hover:underline font-semibold">
              View Area Module
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs">
            {Object.entries(todaySalesByArea).map(([areaName, val]) => (
              <div key={areaName} className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 block truncate">{areaName}</span>
                <span className="font-bold text-slate-900 block mt-0.5">{formatPKR(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS SECTION (7 REAL VISUALIZATIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Sales & Collection Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sales vs. Collection Trend</h2>
              <p className="text-[11px] text-slate-500">Real-time daily transaction velocity</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => formatPKR(val)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="collections" name="Collections" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#collectGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Purchases & Expense Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Purchases & Operating Expenses</h2>
              <p className="text-[11px] text-slate-500">Outflow tracking for stock intake and fleet</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => formatPKR(val)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="purchases" name="Purchases" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Area-wise Cumulative Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Area-wise Total Sales Volume</h2>
              <p className="text-[11px] text-slate-500">Distribution penetration across key Faisalabad territories</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  formatter={(val: number) => formatPKR(val)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="sales" name="Sales Volume" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Daily Profit Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Realized Net Profit Trend</h2>
              <p className="text-[11px] text-slate-500">Calculated after COGS and operating expenses</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => formatPKR(val)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
