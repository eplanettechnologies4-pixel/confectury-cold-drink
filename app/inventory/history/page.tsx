'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowLeftRight, Download } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { InventoryTransaction } from '@/types';
import { formatDateDDMMYYYY } from '@/lib/utils';

export default function StockHistoryPage() {
  const { inventoryTransactions } = useAppState();

  const columns: Column<InventoryTransaction>[] = [
    {
      header: 'Date & Reference',
      cell: (tx) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block">{tx.reference}</span>
          <span className="text-[11px] text-slate-500">{formatDateDDMMYYYY(tx.date)}</span>
        </div>
      ),
    },
    {
      header: 'Product Name / SKU',
      cell: (tx) => (
        <div>
          <span className="font-bold text-slate-800 block">{tx.productName}</span>
          <span className="font-mono text-[11px] text-slate-500">SKU: {tx.sku}</span>
        </div>
      ),
    },
    {
      header: 'Movement Type',
      cell: (tx) => {
        let badgeColor = 'bg-slate-100 text-slate-700';
        if (tx.type.includes('PURCHASE') || tx.type === 'Stock In') badgeColor = 'bg-emerald-100 text-emerald-800';
        else if (tx.type.includes('SALE') || tx.type === 'Stock Out') badgeColor = 'bg-blue-100 text-blue-800';
        else if (tx.type.includes('DAMAGE') || tx.type.includes('EXPIRY')) badgeColor = 'bg-rose-100 text-rose-800';
        else if (tx.type.includes('RETURN')) badgeColor = 'bg-amber-100 text-amber-800';

        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
            {tx.type}
          </span>
        );
      },
    },
    {
      header: 'Quantity Delta',
      cell: (tx) => (
        <span className={`font-bold text-xs ${tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {tx.unit || 'units'}
        </span>
      ),
    },
    {
      header: 'Stock Shift',
      cell: (tx) => (
        <div className="text-xs text-slate-600">
          <span>{tx.previousStock}</span> → <span className="font-bold text-slate-900">{tx.newStock}</span>
        </div>
      ),
    },
    {
      header: 'User / Performed By',
      cell: (tx) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800 block">{tx.user}</span>
          {tx.notes && <span className="text-[10px] text-slate-400 italic truncate block max-w-xs">{tx.notes}</span>}
        </div>
      ),
    },
  ];

  const handleExportCSV = () => {
    const headers = 'Date,Reference,SKU,Product,Type,Quantity,Previous Stock,New Stock,User,Notes\n';
    const rows = inventoryTransactions
      .map(
        t =>
          `"${t.date}","${t.reference}","${t.sku}","${t.productName.replace(/"/g, '""')}","${t.type}",${t.quantity},${t.previousStock},${t.newStock},"${t.user}","${(t.notes || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Stock_History_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/inventory" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Movement Audit History</h1>
            <p className="text-xs text-slate-500">Full immutable audit trail of stock reception, sales, and manual adjustments.</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Audit Table */}
      <DataTable
        columns={columns}
        data={inventoryTransactions}
        searchPlaceholder="Search movement history..."
        searchField={(t) => `${t.reference} ${t.productName} ${t.sku} ${t.user} ${t.type}`}
        filters={[
          {
            key: 'type',
            label: 'Movement Type',
            options: [
              { label: 'Purchases', value: 'PURCHASE' },
              { label: 'Sales', value: 'SALE' },
              { label: 'Sales Returns', value: 'SALES_RETURN' },
              { label: 'Purchase Returns', value: 'PURCHASE_RETURN' },
              { label: 'Expiry Write-Offs', value: 'EXPIRY_WRITE_OFF' },
              { label: 'Damage Write-Offs', value: 'DAMAGE_WRITE_OFF' },
              { label: 'Adjustments', value: 'STOCK_ADJUSTMENT' },
            ],
          },
        ]}
      />
    </div>
  );
}
