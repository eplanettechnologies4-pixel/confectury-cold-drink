'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Trash2,
  Calendar,
  Layers,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Banknote,
  Filter,
  Search,
  XCircle,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate } from '@/lib/utils';
import { ExpiryRecord, DamagedStockRecord } from '@/types';

export default function ExpiryDamagePage() {
  const {
    products,
    expiryRecords,
    writeOffExpiredStock,
    damagedStockRecords,
    recordDamagedStock,
    currentUser,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'expiry' | 'damaged'>('expiry');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | '7days' | '15days' | '30days' | 'written_off'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Write-off Modal State
  const [writeOffModalOpen, setWriteOffModalOpen] = useState(false);
  const [selectedExpiryRecord, setSelectedExpiryRecord] = useState<ExpiryRecord | null>(null);
  const [writeOffQty, setWriteOffQty] = useState(1);
  const [writeOffReason, setWriteOffReason] = useState('Expired past safe consumption threshold');

  // New Damaged Stock Modal State
  const [damagedModalOpen, setDamagedModalOpen] = useState(false);
  const [damagedProduct, setDamagedProduct] = useState(products[0]?.id || '');
  const [damagedBatch, setDamagedBatch] = useState('BATCH-2026-01');
  const [damagedQty, setDamagedQty] = useState(1);
  const [damagedReason, setDamagedReason] = useState<'Broken bottles' | 'Damaged packaging' | 'Leakage' | 'Warehouse damage' | 'Transport damage'>('Broken bottles');
  const [damagedNotes, setDamagedNotes] = useState('');

  // Date calculation helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysToExpiry = (expiryDateStr: string) => {
    const expDate = new Date(expiryDateStr);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter Expiry Records
  const filteredExpiry = expiryRecords.filter(rec => {
    const matchesSearch =
      rec.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.batch.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const days = getDaysToExpiry(rec.expiryDate);

    if (expiryFilter === 'written_off') return rec.status === 'Written Off';
    if (rec.status === 'Written Off') return false; // don't show written off in active filter views

    if (expiryFilter === 'expired') return days < 0;
    if (expiryFilter === '7days') return days >= 0 && days <= 7;
    if (expiryFilter === '15days') return days >= 0 && days <= 15;
    if (expiryFilter === '30days') return days >= 0 && days <= 30;

    return true;
  });

  // KPI calculations
  const activeExpRecords = expiryRecords.filter(r => r.status !== 'Written Off');
  const expiredList = activeExpRecords.filter(r => getDaysToExpiry(r.expiryDate) < 0);
  const expiringSoon30List = activeExpRecords.filter(r => {
    const d = getDaysToExpiry(r.expiryDate);
    return d >= 0 && d <= 30;
  });

  const expiredValue = expiredList.reduce((acc, r) => acc + r.quantity * r.purchaseCost, 0);
  const expiringSoon30Value = expiringSoon30List.reduce((acc, r) => acc + r.quantity * r.purchaseCost, 0);
  const totalWrittenOffLoss = expiryRecords
    .filter(r => r.status === 'Written Off')
    .reduce((acc, r) => acc + r.quantity * r.purchaseCost, 0);

  const totalDamagedLoss = damagedStockRecords.reduce((acc, r) => acc + r.totalLoss, 0);
  const totalDamagedUnits = damagedStockRecords.reduce((acc, r) => acc + r.quantity, 0);

  // Handle write off submission
  const handleConfirmWriteOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpiryRecord) return;
    if (writeOffQty <= 0 || writeOffQty > selectedExpiryRecord.quantity) {
      alert(`Please enter a quantity between 1 and ${selectedExpiryRecord.quantity}`);
      return;
    }
    writeOffExpiredStock(selectedExpiryRecord.id, writeOffQty, writeOffReason);
    setWriteOffModalOpen(false);
    setSelectedExpiryRecord(null);
  };

  // Handle record damaged stock submission
  const handleConfirmDamaged = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === damagedProduct);
    if (!prod) return;
    if (damagedQty <= 0) {
      alert('Quantity must be greater than zero');
      return;
    }
    if (damagedQty > prod.currentStock) {
      alert(`Cannot write off ${damagedQty} units. Current stock for ${prod.name} is only ${prod.currentStock}.`);
      return;
    }

    recordDamagedStock({
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      batch: damagedBatch || 'BATCH-001',
      quantity: damagedQty,
      unit: prod.unit,
      unitCost: prod.costPrice,
      date: getTodayKarachiDate(),
      reason: damagedReason,
      recordedBy: currentUser?.name || 'Administrator',
      approvedBy: currentUser?.role === 'Admin' ? currentUser.name : 'Branch Manager',
      notes: damagedNotes,
    });

    setDamagedModalOpen(false);
    setDamagedQty(1);
    setDamagedNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/inventory" className="text-slate-400 hover:text-slate-600 transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expiry & Damaged Stock</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track batches, isolate expiring confectionery & beverages, and process authorized write-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'damaged' && (
            <button
              onClick={() => setDamagedModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              <span>Record Damaged Stock</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('expiry')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'expiry'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Batch Expiry Tracking ({expiryRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('damaged')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'damaged'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Damaged Stock Records ({damagedStockRecords.length})</span>
        </button>
      </div>

      {/* EXPIRY TAB CONTENT */}
      {activeTab === 'expiry' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs bg-red-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-red-700">Expired Stock</span>
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-900 mt-2">{expiredList.length} <span className="text-xs font-normal text-red-600">batches</span></p>
              <p className="text-xs text-red-600 mt-1">Cost Loss: {formatPKR(expiredValue)}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-700">Expiring ≤ 30 Days</span>
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-900 mt-2">{expiringSoon30List.length} <span className="text-xs font-normal text-amber-600">batches</span></p>
              <p className="text-xs text-amber-600 mt-1">At Risk: {formatPKR(expiringSoon30Value)}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">Safe Batches</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-900 mt-2">
                {activeExpRecords.length - expiredList.length - expiringSoon30List.length} <span className="text-xs font-normal text-emerald-600">batches</span>
              </p>
              <p className="text-xs text-emerald-600 mt-1">Sufficient shelf life</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Historical Written Off</span>
                <Trash2 className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{formatPKR(totalWrittenOffLoss)}</p>
              <p className="text-xs text-slate-500 mt-1">Recognized P&L losses</p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Active' },
                { id: 'expired', label: 'Expired' },
                { id: '7days', label: 'Within 7 Days' },
                { id: '15days', label: 'Within 15 Days' },
                { id: '30days', label: 'Within 30 Days' },
                { id: 'written_off', label: 'Written Off' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setExpiryFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    expiryFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search product or batch..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Product / Category</th>
                    <th className="py-3 px-4">Batch No</th>
                    <th className="py-3 px-4">Mfg / Expiry Date</th>
                    <th className="py-3 px-4">Remaining Days</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Cost Value</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpiry.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No batch expiry records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpiry.map(rec => {
                      const days = getDaysToExpiry(rec.expiryDate);
                      const isExpired = days < 0;
                      const isCritical = days >= 0 && days <= 15;

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{rec.productName}</span>
                            <span className="text-[11px] text-indigo-600 font-semibold">{rec.category}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                              {rec.batch}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-[11px]">
                              <span className="text-slate-500">Mfg: {formatDateDDMMYYYY(rec.manufacturingDate)}</span>
                              <span className="font-semibold text-slate-900 block">Exp: {formatDateDDMMYYYY(rec.expiryDate)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {rec.status === 'Written Off' ? (
                              <span className="text-slate-400 font-medium">Written Off</span>
                            ) : isExpired ? (
                              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                Overdue by {Math.abs(days)}d
                              </span>
                            ) : isCritical ? (
                              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                {days} days left
                              </span>
                            ) : (
                              <span className="text-slate-600 font-medium">{days} days left</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">{rec.quantity}</span>{' '}
                            <span className="text-[11px] text-slate-500">{rec.unit}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">
                              {formatPKR(rec.quantity * rec.purchaseCost)}
                            </span>
                            <span className="text-[10px] text-slate-400">@ {formatPKR(rec.purchaseCost)}/unit</span>
                          </td>
                          <td className="py-3 px-4">
                            {rec.status === 'Written Off' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                Written Off
                              </span>
                            ) : isExpired ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                                Expired
                              </span>
                            ) : days <= 30 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                                Expiring Soon
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                Safe
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {rec.status !== 'Written Off' && (
                              <button
                                onClick={() => {
                                  setSelectedExpiryRecord(rec);
                                  setWriteOffQty(rec.quantity);
                                  setWriteOffModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-semibold transition"
                              >
                                Write-Off Loss
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DAMAGED STOCK TAB CONTENT */}
      {activeTab === 'damaged' && (
        <div className="space-y-6">
          {/* Damaged KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-700">Total Damaged Losses</span>
                <Banknote className="h-5 w-5 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-rose-900 mt-2">{formatPKR(totalDamagedLoss)}</p>
              <p className="text-xs text-rose-600 mt-1">COGS inventory write-off</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Total Units Damaged</span>
                <Layers className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{totalDamagedUnits} <span className="text-xs font-normal text-slate-500">units</span></p>
              <p className="text-xs text-slate-500 mt-1">Deducted from stock records</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Incident Incidences</span>
                <ShieldAlert className="h-5 w-5 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{damagedStockRecords.length} <span className="text-xs font-normal text-slate-500">records</span></p>
              <p className="text-xs text-slate-500 mt-1">Audited with reasons</p>
            </div>
          </div>

          {/* Damaged Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date & ID</th>
                    <th className="py-3 px-4">Product / Category</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Unit Cost</th>
                    <th className="py-3 px-4">Total Loss</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Personnel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {damagedStockRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No damaged stock records found.
                      </td>
                    </tr>
                  ) : (
                    damagedStockRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{rec.id}</span>
                          <span className="text-[11px] text-slate-500">{formatDateDDMMYYYY(rec.date)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{rec.productName}</span>
                          <span className="text-[11px] text-indigo-600 font-semibold">{rec.category}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {rec.batch}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-rose-600">-{rec.quantity}</span>{' '}
                          <span className="text-[11px] text-slate-500">{rec.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatPKR(rec.unitCost)}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600">
                          {formatPKR(rec.totalLoss)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-rose-50 text-rose-700">
                            {rec.reason}
                          </span>
                          {rec.notes && <p className="text-[10px] text-slate-400 mt-0.5 italic">{rec.notes}</p>}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          <span className="text-slate-900 font-medium block">By: {rec.recordedBy}</span>
                          <span className="text-slate-500">Appr: {rec.approvedBy}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WRITE-OFF EXPIRED STOCK */}
      {writeOffModalOpen && selectedExpiryRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900">Authorize Expired Stock Write-Off</h2>
            <p className="text-xs text-slate-500 mt-1">
              This action will deduct physical inventory and log a non-recoverable financial expense under P&L.
            </p>

            <form onSubmit={handleConfirmWriteOff} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-bold text-slate-900">{selectedExpiryRecord.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch Number:</span>
                  <span className="font-mono text-slate-700">{selectedExpiryRecord.batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Batch Stock:</span>
                  <span className="font-bold text-slate-900">{selectedExpiryRecord.quantity} {selectedExpiryRecord.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cost per Unit:</span>
                  <span>{formatPKR(selectedExpiryRecord.purchaseCost)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity to Write-Off ({selectedExpiryRecord.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedExpiryRecord.quantity}
                  value={writeOffQty}
                  onChange={e => setWriteOffQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loss Realization (Financial Impact)
                </label>
                <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                  {formatPKR(writeOffQty * selectedExpiryRecord.purchaseCost)} (COGS Expiry Loss)
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Write-off Reason *</label>
                <input
                  type="text"
                  value={writeOffReason}
                  onChange={e => setWriteOffReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWriteOffModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Confirm Write-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD DAMAGED STOCK */}
      {damagedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900">Record Damaged / Breakage Stock</h2>
            <p className="text-xs text-slate-500 mt-1">
              Log broken bottles, packaging tears, or transport damage. Inventory will be immediately adjusted.
            </p>

            <form onSubmit={handleConfirmDamaged} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={damagedProduct}
                  onChange={e => setDamagedProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category}) — Avail: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Identifier</label>
                  <input
                    type="text"
                    value={damagedBatch}
                    onChange={e => setDamagedBatch(e.target.value)}
                    placeholder="BATCH-2026-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Damage Reason *</label>
                  <select
                    value={damagedReason}
                    onChange={e => setDamagedReason(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Broken bottles">Broken bottles (Glass/Can leakage)</option>
                    <option value="Damaged packaging">Damaged packaging (Carton rupture)</option>
                    <option value="Leakage">Liquid Leakage</option>
                    <option value="Warehouse damage">Warehouse handling accident</option>
                    <option value="Transport damage">Distribution van transit damage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Damaged Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={damagedQty}
                  onChange={e => setDamagedQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Circumstances</label>
                <textarea
                  rows={2}
                  value={damagedNotes}
                  onChange={e => setDamagedNotes(e.target.value)}
                  placeholder="e.g. Broken during unloading at Tezab Mills warehouse"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDamagedModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Record Damaged Loss
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
