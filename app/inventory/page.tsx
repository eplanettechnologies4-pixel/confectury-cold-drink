'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Layers,
  ArrowLeftRight,
  Coins,
  TrendingUp,
  Clock,
  ShieldCheck,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Product } from '@/types';
import { formatPKR } from '@/lib/utils';

export default function InventoryPage() {
  const router = useRouter();
  const { products, adjustProductStock } = useAppState();

  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Confectionery' | 'Cold Drinks'>('All');
  const [stockLevelFilter, setStockLevelFilter] = useState<'All' | 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock'>('All');

  // Quick Stock Adjust Modal State
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Physical stock count update');

  // Overall metrics
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalCostValuation = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
  const potentialMargin = totalRetailValuation - totalCostValuation;
  const marginPct = totalRetailValuation > 0 ? (potentialMargin / totalRetailValuation) * 100 : 0;

  // Category-wise Breakdown
  const coldDrinksProducts = products.filter(p => p.category === 'Cold Drinks');
  const confectioneryProducts = products.filter(p => p.category === 'Confectionery');

  const coldDrinksCost = coldDrinksProducts.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const coldDrinksRetail = coldDrinksProducts.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
  const coldDrinksUnits = coldDrinksProducts.reduce((acc, p) => acc + p.currentStock, 0);

  const confectioneryCost = confectioneryProducts.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const confectioneryRetail = confectioneryProducts.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
  const confectioneryUnits = confectioneryProducts.reduce((acc, p) => acc + p.currentStock, 0);

  // Stock status counts
  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockLevel).length;
  const criticalStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= Math.floor(p.minStockLevel / 2)).length;
  const outOfStockCount = products.filter(p => p.currentStock === 0).length;

  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (stockLevelFilter === 'In Stock') return p.currentStock > p.minStockLevel;
    if (stockLevelFilter === 'Low Stock') return p.currentStock > 0 && p.currentStock <= p.minStockLevel;
    if (stockLevelFilter === 'Critical') return p.currentStock > 0 && p.currentStock <= Math.floor(p.minStockLevel / 2);
    if (stockLevelFilter === 'Out of Stock') return p.currentStock === 0;
    return true;
  });

  const handleOpenAdjustModal = (product: Product, defaultMode: 'add' | 'subtract' | 'set' = 'add') => {
    setSelectedProductForAdjust(product);
    setAdjustMode(defaultMode);
    setAdjustQuantity(defaultMode === 'set' ? product.currentStock : 10);
    setAdjustReason(
      defaultMode === 'add'
        ? 'Received additional warehouse stock'
        : defaultMode === 'subtract'
        ? 'Physical inventory adjustment'
        : 'Physical count verification'
    );
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;

    let targetStock = selectedProductForAdjust.currentStock;
    if (adjustMode === 'add') {
      targetStock = selectedProductForAdjust.currentStock + Math.max(0, Number(adjustQuantity));
    } else if (adjustMode === 'subtract') {
      targetStock = Math.max(0, selectedProductForAdjust.currentStock - Math.max(0, Number(adjustQuantity)));
    } else {
      targetStock = Math.max(0, Number(adjustQuantity));
    }

    adjustProductStock(selectedProductForAdjust.id, targetStock, adjustReason);
    setSelectedProductForAdjust(null);
  };

  const columns: Column<Product>[] = [
    {
      header: 'Product / Picture',
      accessorKey: 'name',
      cell: (prod) => (
        <div className="flex items-center space-x-3">
          {prod.imageUrl ? (
            <img
              src={prod.imageUrl}
              alt={prod.name}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
              <Package className="h-5 w-5" />
              <span className="text-[8px] font-bold mt-0.5 uppercase">{prod.category === 'Cold Drinks' ? 'Drink' : 'Sweet'}</span>
            </div>
          )}
          <div>
            <span className="font-bold text-slate-900 block text-xs">{prod.name}</span>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
              <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">SKU: {prod.sku}</span>
              <span>•</span>
              <span>{prod.brand || 'General'}</span>
              {prod.barcode && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-400">BC: {prod.barcode}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category & Unit',
      cell: (prod) => (
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
            prod.category === 'Cold Drinks' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {prod.category}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {prod.unit} ({prod.unitsPerCarton || 24} pcs/carton)
          </span>
        </div>
      ),
    },
    {
      header: 'Current Stock on Hand',
      cell: (prod) => {
        const isCritical = prod.currentStock > 0 && prod.currentStock <= Math.floor(prod.minStockLevel / 2);
        const isLow = prod.currentStock > 0 && prod.currentStock <= prod.minStockLevel;
        const isOut = prod.currentStock === 0;
        const totalPcs = prod.currentStock * (prod.unitsPerCarton || 24);

        return (
          <div className="text-xs">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-extrabold ${isOut ? 'text-rose-600' : isCritical ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                {prod.currentStock.toLocaleString()} {prod.unit}s
              </span>
              <span className="text-[10px] text-slate-400">({prod.availableStock} avail)</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
              ≈ {totalPcs.toLocaleString()} single units
            </span>
          </div>
        );
      },
    },
    {
      header: 'Stock Status',
      cell: (prod) => {
        if (prod.currentStock === 0) {
          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Out of Stock</span>;
        }
        if (prod.currentStock <= Math.floor(prod.minStockLevel / 2)) {
          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Critical Stock</span>;
        }
        if (prod.currentStock <= prod.minStockLevel) {
          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Low Stock</span>;
        }
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">In Stock</span>;
      },
    },
    {
      header: 'Pricing & Valuation (PKR)',
      cell: (prod) => {
        const costVal = prod.currentStock * prod.costPrice;
        const retVal = prod.currentStock * prod.sellingPrice;
        return (
          <div className="text-xs">
            <span className="font-bold text-slate-900 block font-mono">
              Cost: {formatPKR(costVal)}
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold block font-mono">
              Retail: {formatPKR(retVal)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Manage Inventory',
      className: 'text-right',
      cell: (prod) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => handleOpenAdjustModal(prod, 'add')}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition"
            title="Quick Add Stock"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Stock</span>
          </button>
          <button
            onClick={() => handleOpenAdjustModal(prod, 'set')}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            title="Set exact stock count"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Adjust</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory & Stock Tracking</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track exact product quantities on hand, add or adjust stock with 1 click, and check stock valuation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/inventory/products"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Package className="h-4 w-4" />
            <span>Manage Products</span>
          </Link>
          <Link
            href="/purchases/new"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Receive Purchase</span>
          </Link>
          <Link
            href="/inventory/history"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Movement History</span>
          </Link>
        </div>
      </div>

      {/* Primary Stock Valuation Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Products</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{products.length} SKUs</span>
          <span className="text-[11px] text-slate-500">{totalUnits.toLocaleString()} total cartons/packs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">Inventory Valuation (Cost)</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{formatPKR(totalCostValuation)}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Purchase cost balance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider block">Potential Retail Value</span>
          <span className="text-2xl font-extrabold text-indigo-700 mt-1 block">{formatPKR(totalRetailValuation)}</span>
          <span className="text-[11px] text-indigo-600 font-medium">Wholesale revenue value</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Gross Margin Spread</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{formatPKR(potentialMargin)}</span>
          <span className="text-[11px] text-emerald-600 font-semibold">+{marginPct.toFixed(1)}% margin</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">Stock Alerts</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-700">{lowStockCount} Low</span>
            {outOfStockCount > 0 && (
              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                {outOfStockCount} Out
              </span>
            )}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">{criticalStockCount} critical items</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          {(['All', 'Confectionery', 'Cold Drinks'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          <span className="text-xs font-semibold text-slate-500 ml-3">Stock Level:</span>
          {(['All', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock'] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setStockLevelFilter(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                stockLevelFilter === lvl
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <Link
          href="/inventory/products"
          className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>+ Add New Product to Inventory</span>
        </Link>
      </div>

      {/* Main Product Table or Clean Empty State */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Your Inventory is Starting at 0</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            All mock inventory counts have been reset. Add products from your catalog to manage how much products you have in cartons and units.
          </p>
          <Link
            href="/inventory/products"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Products & Set Stock</span>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchPlaceholder="Search products by name, SKU, or brand..."
          searchField={(p) => `${p.name} ${p.sku} ${p.category} ${p.brand}`}
        />
      )}

      {/* QUICK STOCK ADJUST MODAL */}
      {selectedProductForAdjust && (
        <Modal
          isOpen={!!selectedProductForAdjust}
          onClose={() => setSelectedProductForAdjust(null)}
          title={`Adjust Inventory: ${selectedProductForAdjust.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
            {/* Product summary card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
              {selectedProductForAdjust.imageUrl ? (
                <img
                  src={selectedProductForAdjust.imageUrl}
                  alt={selectedProductForAdjust.name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                  <Package className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1">
                <span className="font-bold text-slate-900 block">{selectedProductForAdjust.name}</span>
                <span className="text-[11px] text-slate-500">
                  Current Stock: <strong className="text-slate-800">{selectedProductForAdjust.currentStock} {selectedProductForAdjust.unit}s</strong>
                </span>
              </div>
            </div>

            {/* Mode selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Adjustment Action</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustMode('add')}
                  className={`py-2 px-3 rounded-lg font-bold border transition text-center ${
                    adjustMode === 'add'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('subtract')}
                  className={`py-2 px-3 rounded-lg font-bold border transition text-center ${
                    adjustMode === 'subtract'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  - Deduct Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('set')}
                  className={`py-2 px-3 rounded-lg font-bold border transition text-center ${
                    adjustMode === 'set'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Set Count
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {adjustMode === 'add'
                  ? `Quantity to Add (${selectedProductForAdjust.unit}s)`
                  : adjustMode === 'subtract'
                  ? `Quantity to Deduct (${selectedProductForAdjust.unit}s)`
                  : `New Total Stock Count (${selectedProductForAdjust.unit}s)`}
              </label>
              <input
                type="number"
                min="0"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono focus:bg-white focus:border-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Resulting Stock on Hand will be:{' '}
                <strong className="text-slate-900">
                  {adjustMode === 'add'
                    ? selectedProductForAdjust.currentStock + Number(adjustQuantity)
                    : adjustMode === 'subtract'
                    ? Math.max(0, selectedProductForAdjust.currentStock - Number(adjustQuantity))
                    : Number(adjustQuantity)}{' '}
                  {selectedProductForAdjust.unit}s
                </strong>
              </span>
            </div>

            {/* Reason */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for adjustment</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Received new stock / Physical recount"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedProductForAdjust(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Save Stock Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
