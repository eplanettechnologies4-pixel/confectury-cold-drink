'use client';

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  CreditCard,
  FileText,
  Banknote,
  Phone,
  MapPin,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Supplier } from '@/types';
import { formatPKR, formatDateDDMMYYYY, getTodayKarachiDate, BUSINESS_CONFIG } from '@/lib/utils';

export default function SuppliersManagementPage() {
  const { suppliers, addSupplier, updateSupplier, purchases, purchaseReturns, supplierPayments, recordSupplierPayment, currentUser } = useAppState();

  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);

  // Supplier Form State
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    openingPayable: 0,
    paymentTerms: '15 Days',
    status: 'Active' as 'Active' | 'Inactive',
    notes: '',
  });

  // Supplier Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const openAddSupplierModal = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      contactPerson: '',
      phone: '',
      address: 'Faisalabad',
      openingPayable: 0,
      paymentTerms: '15 Days',
      status: 'Active',
      notes: '',
    });
    setIsAddSupplierModalOpen(true);
  };

  const openEditSupplierModal = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierFormData({
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      address: s.address,
      openingPayable: s.openingPayable,
      paymentTerms: s.paymentTerms,
      status: s.status,
      notes: s.notes || '',
    });
    setIsAddSupplierModalOpen(true);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierFormData);
    } else {
      addSupplier(supplierFormData);
    }
    setIsAddSupplierModalOpen(false);
  };

  const handleOpenPayment = (s: Supplier) => {
    setPaymentSupplier(s);
    setPaymentAmount(s.currentPayable > 0 ? s.currentPayable : 50000);
    setPaymentRef(`TXN-${Date.now().toString().slice(-4)}`);
    setPaymentNotes(`Supplier payable settlement for ${s.name}`);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSupplier || paymentAmount <= 0) return;

    recordSupplierPayment({
      supplierId: paymentSupplier.id,
      supplierName: paymentSupplier.name,
      paymentDate: getTodayKarachiDate(),
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: paymentRef,
      notes: paymentNotes,
      recordedBy: currentUser?.name || 'Accounts Manager',
    });

    setPaymentSupplier(null);
  };

  const columns: Column<Supplier>[] = [
    {
      header: 'Supplier Name',
      accessorKey: 'name',
      cell: (s) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{s.name}</span>
          <span className="font-mono text-[10px] text-slate-500 font-semibold">{s.supplierId}</span>
        </div>
      ),
    },
    {
      header: 'Contact Person & Phone',
      cell: (s) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 block">{s.contactPerson}</span>
          <span className="text-slate-500 font-mono text-[11px]">{s.phone}</span>
        </div>
      ),
    },
    {
      header: 'Address',
      cell: (s) => <span className="text-xs text-slate-600 line-clamp-1">{s.address}</span>,
    },
    {
      header: 'Terms',
      cell: (s) => <span className="text-xs text-slate-700 font-medium">{s.paymentTerms}</span>,
    },
    {
      header: 'Current Payable (PKR)',
      cell: (s) => (
        <span className={`font-mono text-xs font-black ${s.currentPayable > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatPKR(s.currentPayable)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (s) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            s.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {s.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (s) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => setStatementSupplier(s)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded"
            title="View Supplier Statement"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenPayment(s)}
            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
            title="Record Supplier Payment"
          >
            <CreditCard className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditSupplierModal(s)}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
            title="Edit Supplier"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-brand-600" /> Supplier Management & Payables
          </h1>
          <p className="text-xs text-slate-500">
            Authorized beverage bottlers and confectionery manufacturers supplying Ahmad Traders.
          </p>
        </div>

        <button
          onClick={openAddSupplierModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Supplier DataTable */}
      <DataTable
        columns={columns}
        data={suppliers}
        searchPlaceholder="Search supplier by company, contact person, or phone..."
        searchField={(s) => `${s.name} ${s.contactPerson} ${s.phone} ${s.supplierId}`}
      />

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isAddSupplierModalOpen}
        onClose={() => setIsAddSupplierModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register Authorized Supplier'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSupplierSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Manufacturer Name *</label>
            <input
              type="text"
              placeholder="e.g. Coca-Cola Beverages Pakistan Ltd"
              value={supplierFormData.name}
              onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
              <input
                type="text"
                placeholder="e.g. Zubair Sheikh"
                value={supplierFormData.contactPerson}
                onChange={e => setSupplierFormData({ ...supplierFormData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                placeholder="0418541200"
                value={supplierFormData.phone}
                onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Depot / Factory Address</label>
            <input
              type="text"
              placeholder="Plot 14-B, Small Industrial Estate, Faisalabad"
              value={supplierFormData.address}
              onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={supplierFormData.paymentTerms}
                onChange={e => setSupplierFormData({ ...supplierFormData, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                <option value="Cash">Cash on Delivery</option>
                <option value="7 Days">7 Days</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Opening Payable Balance (PKR)</label>
              <input
                type="number"
                min="0"
                value={supplierFormData.openingPayable}
                onChange={e => setSupplierFormData({ ...supplierFormData, openingPayable: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                disabled={!!editingSupplier}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Supplied Brand Lines</label>
            <textarea
              rows={2}
              placeholder="e.g. CCBPL cold drinks & energy drinks line"
              value={supplierFormData.notes}
              onChange={e => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddSupplierModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-xs"
            >
              {editingSupplier ? 'Save Supplier Changes' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Supplier Payment Modal */}
      {paymentSupplier && (
        <Modal
          isOpen={!!paymentSupplier}
          onClose={() => setPaymentSupplier(null)}
          title={`Record Supplier Payment — ${paymentSupplier.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier:</span>
                <span className="font-bold text-slate-900">{paymentSupplier.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Outstanding Payable:</span>
                <span className="font-bold font-mono text-rose-600">{formatPKR(paymentSupplier.currentPayable)}</span>
              </div>
              <p className="text-[10px] text-slate-400 italic pt-1">
                * Note: Supplier payments reduce inventory payable and do not affect sales or create duplicate operational expenses.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Disbursed Amount (PKR) *</label>
              <input
                type="number"
                min="1"
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700 text-sm"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                <option value="Bank Transfer">Bank Transfer / Online RTGS</option>
                <option value="Cheque">Crossed Cheque</option>
                <option value="Cash">Cash Handover</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
              <input
                type="text"
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes / Factory Voucher Details</label>
              <input
                type="text"
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPaymentSupplier(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Post Supplier Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Supplier Statement Modal */}
      {statementSupplier && (
        <Modal
          isOpen={!!statementSupplier}
          onClose={() => setStatementSupplier(null)}
          title={`Supplier Statement: ${statementSupplier.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-extrabold text-slate-900 text-sm block">{statementSupplier.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">ID: {statementSupplier.supplierId} • Ph: {statementSupplier.phone}</span>
                <p className="text-slate-600 text-[11px] mt-0.5">{statementSupplier.address}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Closing Payable</span>
                <span className="text-lg font-black font-mono text-rose-600">{formatPKR(statementSupplier.currentPayable)}</span>
              </div>
            </div>

            {/* Statement Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Transaction</th>
                    <th className="py-2 px-3">Reference</th>
                    <th className="py-2 px-3 text-right">Debit (Paid)</th>
                    <th className="py-2 px-3 text-right">Credit (Purchased)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-mono text-slate-500">{formatDateDDMMYYYY(statementSupplier.createdAt)}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">Opening Payable Balance</td>
                    <td className="py-2 px-3 font-mono text-slate-500">-</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatPKR(statementSupplier.openingPayable)}</td>
                  </tr>

                  {/* Purchases from this supplier */}
                  {purchases
                    .filter(p => p.supplierId === statementSupplier.id && p.status === 'Posted')
                    .map(p => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-mono text-slate-500">{formatDateDDMMYYYY(p.purchaseDate)}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">Purchase Consignment</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{p.invoiceNumber}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatPKR(p.grandTotal)}</td>
                      </tr>
                    ))}

                  {/* Payments to this supplier */}
                  {supplierPayments
                    .filter(sp => sp.supplierId === statementSupplier.id)
                    .map(sp => (
                      <tr key={sp.id} className="bg-emerald-50/40">
                        <td className="py-2 px-3 font-mono text-slate-500">{formatDateDDMMYYYY(sp.paymentDate)}</td>
                        <td className="py-2 px-3 font-semibold text-emerald-800">Supplier Payment Handover</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{sp.paymentNumber}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatPKR(sp.amount)}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setStatementSupplier(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
              >
                Close Statement
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
