'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  ShoppingCart,
  Banknote,
  Printer,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Calendar,
  FileText,
  Package,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { clients, orders, payments, getLedgerForClient, recordPayment } = useAppState();

  const client = clients.find(c => c.id === clientId || c.clientId === clientId);
  const clientOrders = orders.filter(o => o.clientId === client?.id);
  const clientPayments = payments.filter(p => p.clientId === client?.id);
  const clientLedger = client ? getLedgerForClient(client.id) : [];

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'ledger' | 'payments'>('overview');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(1000);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'Other'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');

  if (!client) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Client Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested client profile does not exist or was removed.</p>
        <Link href="/clients" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">
          Return to Clients Directory
        </Link>
      </div>
    );
  }

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    recordPayment({
      clientId: client.id,
      clientName: `${client.name} (${client.companyName})`,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: paymentRef || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      recordedBy: 'Michael Chang',
    });

    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-erp space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start space-x-3">
            <Link href="/clients" className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition mt-1">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-slate-900">{client.companyName}</h1>
                <StatusBadge status={client.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Contact: <span className="font-semibold text-slate-700">{client.name}</span> • Client ID: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{client.clientId}</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Banknote className="h-4 w-4" />
              <span>Record Payment</span>
            </button>
            <Link
              href={`/orders/new?clientId=${client.id}`}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>New Order</span>
            </Link>
            <Link
              href={`/clients/${client.id}/ledger`}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <BookOpen className="h-4 w-4" />
              <span>View Ledger</span>
            </Link>
            <Link
              href={`/clients/${client.id}/edit`}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Purchases</span>
            <span className="text-lg font-bold text-slate-900">Rs. {client.totalPurchases.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Paid</span>
            <span className="text-lg font-bold text-emerald-600">Rs. {client.totalPaid.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Outstanding Balance</span>
            <span className={`text-lg font-bold ${client.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Rs. {client.currentBalance.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Approved Credit Limit</span>
            <span className="text-lg font-bold text-brand-600">Rs. {client.creditLimit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        <div className="flex space-x-6">
          {(['overview', 'orders', 'ledger', 'payments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-semibold capitalize transition border-b-2 ${
                activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-b-xl border border-slate-200 shadow-erp">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
                <Building className="h-4 w-4 mr-2 text-brand-600" /> Account & Contact Details
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Client Type:</span>
                  <span className="font-semibold text-slate-800">{client.clientType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800">{client.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-800">{client.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tax ID / CNIC:</span>
                  <span className="font-semibold text-slate-800">{client.taxId || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Assigned Sales Rep:</span>
                  <span className="font-semibold text-brand-600">{client.salesRep}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
                <MapPin className="h-4 w-4 mr-2 text-brand-600" /> Address & Financial Terms
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Street Address:</span>
                  <span className="font-semibold text-slate-800 text-right">{client.address.address}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">City / Area:</span>
                  <span className="font-semibold text-slate-800">{client.address.city}, {client.address.area}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Payment Terms:</span>
                  <span className="font-semibold text-slate-800">{client.paymentTerms}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Opening Balance:</span>
                  <span className="font-semibold text-slate-800">Rs. {client.openingBalance.toLocaleString()} ({client.balanceType})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Account Created:</span>
                  <span className="font-semibold text-slate-800">{client.createdAt}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Wholesale Orders History ({clientOrders.length})</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Salesperson</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientOrders.length > 0 ? (
                  clientOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-brand-600">{o.orderNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{o.orderDate}</td>
                      <td className="py-2.5 px-3 text-slate-700">{o.salesperson}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">Rs. {o.grandTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">No orders recorded for this client yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Financial Ledger Summary</h3>
              <Link href={`/clients/${client.id}/ledger`} className="text-xs font-semibold text-brand-600 hover:underline">
                View Full Interactive Ledger →
              </Link>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Ref</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (Rs.)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Rs.)</th>
                  <th className="py-2.5 px-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientLedger.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-600">{entry.date}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-800">{entry.reference}</td>
                    <td className="py-2 px-3 text-slate-700">{entry.description}</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900">{entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString()}` : '-'}</td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-600">{entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString()}` : '-'}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">Rs. {entry.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Payment Transactions</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Payment #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Ref Number</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-emerald-600">{p.paymentNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.paymentDate}</td>
                    <td className="py-2.5 px-3 text-slate-700">{p.paymentMethod}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{p.referenceNumber}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">Rs. {p.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        subtitle={`Receive payment for ${client.companyName}`}
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Amount (Rs.)</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={e => setPaymentAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="Bank Transfer">Bank Transfer / Wire</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reference Number / Transaction ID</label>
            <input
              type="text"
              placeholder="e.g. WT-991204"
              value={paymentRef}
              onChange={e => setPaymentRef(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              Confirm & Post Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
