'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  Package,
  Edit3,
  Trash2,
  Tag,
  Coins,
  Layers,
  Calendar,
  Calculator,
  Check,
  Search,
  Filter,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Product, ProductCategory, ProductPackagingUnit } from '@/types';
import { formatPKR, formatDateDDMMYYYY, BUSINESS_CONFIG } from '@/lib/utils';

export default function ProductsCatalogPage() {
  const { products, addProduct, updateProduct, deleteProduct, suppliers } = useAppState();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState = {
    name: '',
    sku: '',
    barcode: '',
    category: 'Cold Drinks' as ProductCategory,
    brand: '',
    unit: 'Carton' as ProductPackagingUnit,
    purchaseUnit: 'Carton',
    salesUnit: 'Carton',
    unitsPerCarton: 24,
    unitsPerPack: 12,
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    minStockLevel: 10,
    supplier: suppliers[0]?.name || 'Authorized Distributor',
    supplierId: suppliers[0]?.id || '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    description: '',
    imageUrl: '',
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      ...initialFormState,
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      barcode: `896${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: selectedCategory !== 'All' ? selectedCategory : 'Cold Drinks',
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplier: suppliers[0]?.name || 'Authorized Distributor',
      supplierId: suppliers[0]?.id || '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category,
      brand: p.brand,
      unit: p.unit,
      purchaseUnit: p.purchaseUnit || p.unit,
      salesUnit: p.salesUnit || p.unit,
      unitsPerCarton: p.unitsPerCarton || 24,
      unitsPerPack: p.unitsPerPack || 12,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      currentStock: p.currentStock,
      minStockLevel: p.minStockLevel,
      supplier: p.supplier,
      supplierId: p.supplierId || '',
      batchNumber: p.batchNumber || '',
      manufacturingDate: p.manufacturingDate || '',
      expiryDate: p.expiryDate || '',
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      isActive: p.isActive,
    });
    setIsAddModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size exceeds 5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a valid product name');
      return;
    }
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setIsAddModalOpen(false);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const columns: Column<Product>[] = [
    {
      header: 'Product / Picture',
      accessorKey: 'name',
      cell: (p) => (
        <div className="flex items-center space-x-3">
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
              <Package className="h-5 w-5" />
              <span className="text-[8px] font-bold mt-0.5 uppercase">{p.category === 'Cold Drinks' ? 'Drink' : 'Sweet'}</span>
            </div>
          )}
          <div>
            <span className="font-bold text-slate-900 block text-xs">{p.name}</span>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
              <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-semibold">{p.sku}</span>
              {p.barcode && <span>BC: {p.barcode}</span>}
              {p.batchNumber && <span className="text-emerald-700 bg-emerald-50 px-1 rounded">B: {p.batchNumber}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category & Brand',
      cell: (p) => (
        <div>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              p.category === 'Confectionery'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-cyan-100 text-cyan-900 border border-cyan-200'
            }`}
          >
            {p.category}
          </span>
          <span className="text-[10px] text-slate-600 block mt-0.5 font-medium">{p.brand || 'Local / Generic'}</span>
        </div>
      ),
    },
    {
      header: 'Unit & Packaging',
      cell: (p) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 block">{p.unit}</span>
          <span className="text-[10px] text-slate-500">
            {p.unitsPerCarton || 24} pcs/carton • {p.unitsPerPack || 12} pcs/pack
          </span>
        </div>
      ),
    },
    {
      header: 'Prices (PKR)',
      cell: (p) => (
        <div className="text-xs font-mono">
          <span className="font-bold text-slate-900 block">Sale: {formatPKR(p.sellingPrice)}</span>
          <span className="text-[10px] text-slate-500">Cost: {formatPKR(p.costPrice)}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">
            Margin: {p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1) : 0}%
          </span>
        </div>
      ),
    },
    {
      header: 'Stock Status',
      cell: (p) => {
        const totalPcs = p.currentStock * (p.unitsPerCarton || 24);
        return (
          <div>
            <StatusBadge status={p.status} />
            <div className="font-mono text-xs font-bold text-slate-800 mt-1">
              {p.currentStock} {p.unit}s
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              ≈ {totalPcs.toLocaleString()} pcs
            </span>
          </div>
        );
      },
    },
    {
      header: 'Expiry Date',
      cell: (p) => {
        if (!p.expiryDate) return <span className="text-slate-400 text-xs">-</span>;
        const isExp = new Date(p.expiryDate) < new Date();
        return (
          <span className={`text-xs font-mono ${isExp ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
            {formatDateDDMMYYYY(p.expiryDate)}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => openEditModal(p)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
            title="Edit Product"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setProductToDelete(p)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
            title="Delete Product"
          >
            <Trash2 className="h-4 w-4" />
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products Catalog</h1>
          <p className="text-xs text-slate-500">
            Ahmad Traders distribution inventory — Manage products, pictures, pricing, and stock
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Category Filter Pills (Strictly Confectionery and Cold Drinks) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-erp flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center">
            <Filter className="h-3.5 w-3.5 mr-1" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setSelectedCategory('Cold Drinks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedCategory === 'Cold Drinks'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200'
            }`}
          >
            Cold Drinks ({products.filter(p => p.category === 'Cold Drinks').length})
          </button>
          <button
            onClick={() => setSelectedCategory('Confectionery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedCategory === 'Confectionery'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Confectionery ({products.filter(p => p.category === 'Confectionery').length})
          </button>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Total Products: <span className="font-bold text-slate-900">{filteredProducts.length}</span>
        </div>
      </div>

      {/* Products Table or Clean Empty State */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Your Product Catalog is Empty</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            All demo products have been cleared. You are starting fresh from 0! Add your own confectionery and cold drinks items with pictures and prices.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your First Product</span>
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchPlaceholder="Search product by name, brand, SKU, or barcode..."
          searchField={(p) => `${p.name} ${p.brand} ${p.sku} ${p.barcode} ${p.category} ${p.batchNumber}`}
        />
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Distribution Product'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* PRODUCT PICTURE UPLOAD BOX */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800 text-xs flex items-center">
              <ImageIcon className="h-4 w-4 mr-1.5 text-indigo-600" /> Product Picture (Upload or URL)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Picture Preview */}
              <div className="w-24 h-24 rounded-lg border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group">
                {formData.imageUrl ? (
                  <>
                    <img
                      src={formData.imageUrl}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition shadow"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    <span className="text-[9px] block font-medium">No Image</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-xs transition text-xs"
                  >
                    <Upload className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Upload Picture from Device</span>
                  </button>
                  {formData.imageUrl && (
                    <span className="text-[11px] text-emerald-600 font-medium">✓ Picture selected</span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Or enter Image Web URL:</label>
                  <input
                    type="url"
                    placeholder="https://example.com/product-image.jpg"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Coca-Cola 330ml Can (Carton of 24) or Oreo Biscuits"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Top-Level Category * (Strictly 2)</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white"
              >
                <option value="Cold Drinks">Cold Drinks</option>
                <option value="Confectionery">Confectionery</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                placeholder="e.g. The Coca-Cola Company / PepsiCo / Mondelez / Hilal"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU / Item Code *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Barcode (EAN / UPC)</label>
              <input
                type="text"
                placeholder="e.g. 5449000000996"
                value={formData.barcode}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authorized Supplier</label>
              <input
                type="text"
                placeholder="e.g. CCBPL / Pepsi Bottlers / Nestle"
                value={formData.supplier}
                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              />
            </div>
          </div>

          {/* Unit Conversion & Packaging Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center">
              <Calculator className="h-3.5 w-3.5 mr-1.5 text-indigo-600" /> Packaging Units & Conversion
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Packaging Unit</label>
                <select
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="Carton">Carton</option>
                  <option value="Pack">Pack</option>
                  <option value="Box">Box</option>
                  <option value="Crate">Crate</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Piece">Piece</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Units per Carton</label>
                <input
                  type="number"
                  min="1"
                  value={formData.unitsPerCarton}
                  onChange={e => setFormData({ ...formData, unitsPerCarton: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Units per Pack</label>
                <input
                  type="number"
                  min="1"
                  value={formData.unitsPerPack}
                  onChange={e => setFormData({ ...formData, unitsPerPack: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Sales Unit</label>
                <select
                  value={formData.salesUnit}
                  onChange={e => setFormData({ ...formData, salesUnit: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="Carton">Carton</option>
                  <option value="Pack">Pack</option>
                  <option value="Box">Box</option>
                  <option value="Piece">Piece / Bottle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (PKR) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Wholesale Selling Price (PKR) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stock on Hand ({formData.unit}s)</label>
              <input
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={e => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Low Stock Alert ({formData.unit}s)</label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={e => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Batch & Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch Number</label>
              <input
                type="text"
                placeholder="e.g. BATCH-2026-A1"
                value={formData.batchNumber}
                onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Manufacturing Date</label>
              <input
                type="date"
                value={formData.manufacturingDate}
                onChange={e => setFormData({ ...formData, manufacturingDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Flavors, packaging specifications, or supplier notes..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
            >
              {editingProduct ? 'Save Product Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <Modal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          title="Confirm Product Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start space-x-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Delete {productToDelete.name}?</p>
                <p className="text-xs text-rose-700 mt-1">
                  This will remove the product and its SKU ({productToDelete.sku}) from your distribution inventory catalog.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
