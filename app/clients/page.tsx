'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Download, Eye, Edit3, BookOpen, ShoppingCart, Trash2, Phone, Mail, Building, MapPin } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Client } from '@/types';
import { formatPKR, BUSINESS_CONFIG } from '@/lib/utils';

export default function ClientsPage() {
  const router = useRouter();
  const { clients, deleteClient, areas } = useAppState();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('All');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('All');

  const filteredClients = clients.filter(c => {
    if (selectedAreaFilter !== 'All' && c.area !== selectedAreaFilter) return false;
    if (selectedCatFilter !== 'All' && c.partyCategory !== selectedCatFilter) return false;
    return true;
  });

  const columns: Column<Client>[] = [
    {
      header: 'Customer / Shop',
      accessorKey: 'companyName',
      cell: (client) => (
        <div>
          <Link href={`/clients/${client.id}`} className="font-bold text-slate-900 hover:text-brand-600 transition block text-xs">
            {client.companyName}
          </Link>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
            <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600 font-semibold">{client.clientId}</span>
            <span>•</span>
            <span>{client.name}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (client) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
            client.partyCategory === 'A'
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : client.partyCategory === 'B'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          Category {client.partyCategory || 'B'}
        </span>
      ),
    },
    {
      header: 'Distribution Area',
      cell: (client) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 flex items-center">
            <MapPin className="h-3 w-3 mr-1 text-emerald-600 flex-shrink-0" />
            {client.area || client.address?.area || 'Faisalabad'}
          </span>
          <span className="text-[10px] text-slate-500">{client.salesRep || 'Route Rep'}</span>
        </div>
      ),
    },
    {
      header: 'Phone / Contact',
      cell: (client) => (
        <div className="text-xs space-y-0.5 font-mono">
          <div className="flex items-center text-slate-800 font-semibold">
            <Phone className="h-3 w-3 mr-1 text-slate-400" />
            <span>{client.phone}</span>
          </div>
          {client.alternatePhone && (
            <div className="text-[11px] text-slate-500">
              <span>Alt: {client.alternatePhone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Credit Limit',
      cell: (client) => (
        <span className="font-mono text-xs text-slate-700">
          {formatPKR(client.creditLimit)}
        </span>
      ),
    },
    {
      header: 'Outstanding Bal',
      cell: (client) => (
        <span className={`font-bold font-mono text-xs ${client.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatPKR(client.currentBalance)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (client) => <StatusBadge status={client.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (client) => (
        <div className="flex items-center justify-end space-x-1">
          <Link
            href={`/clients/${client.id}`}
            title="View Details"
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-md transition"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            href={`/clients/${client.id}/ledger`}
            title="View Statement & Ledger"
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition"
          >
            <BookOpen className="h-4 w-4" />
          </Link>
          <Link
            href={`/orders/new?clientId=${client.id}`}
            title="Create Sale Invoice"
            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-md transition"
          >
            <ShoppingCart className="h-4 w-4" />
          </Link>
          <Link
            href={`/clients/${client.id}/edit`}
            title="Edit Customer"
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
          >
            <Edit3 className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteTargetId(client.id)}
            title="Delete Customer"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleExportCSV = () => {
    const headers = 'Client ID,Company Name,Contact Person,Area,Category,Phone,Credit Limit,Current Balance,Status\n';
    const rows = filteredClients
      .map(
        c =>
          `"${c.clientId}","${c.companyName}","${c.name}","${c.area}","${c.partyCategory}","${c.phone}",${c.creditLimit},${c.currentBalance},"${c.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ahmad_Traders_Customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Party & Customer Management</h1>
          <p className="text-xs text-slate-500">
            {BUSINESS_CONFIG.name} distribution retail accounts, route assignments, and market credit limits.
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

          <Link
            href="/clients/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp flex flex-wrap items-center gap-4 text-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter by Area:</label>
          <select
            value={selectedAreaFilter}
            onChange={e => setSelectedAreaFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
          >
            <option value="All">All Faisalabad Areas ({clients.length})</option>
            {areas.map(a => (
              <option key={a.id} value={a.name}>
                {a.name} ({clients.filter(c => c.area === a.name).length})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter by Category:</label>
          <select
            value={selectedCatFilter}
            onChange={e => setSelectedCatFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
          >
            <option value="All">All Categories (A, B, C)</option>
            <option value="A">Category A (High Volume)</option>
            <option value="B">Category B (Medium Volume)</option>
            <option value="C">Category C (Low / Cash)</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500 self-end pb-1 font-mono">
          Showing <span className="font-bold text-slate-900">{filteredClients.length}</span> of {clients.length} customers
        </div>
      </div>

      {/* Data Table or Clean Empty State */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Your Customer Directory is Empty</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            All demo parties have been wiped. You are starting clean from 0! Add your own retailers and wholesalers across Faisalabad routes.
          </p>
          <Link
            href="/clients/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Customer</span>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredClients}
          searchPlaceholder="Search customer by name, shop, area, phone, or ID..."
          searchField={(c) => `${c.companyName} ${c.name} ${c.clientId} ${c.phone} ${c.area} ${c.partyCategory}`}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Delete Customer Account"
        message="Are you sure you want to delete this customer account? This will remove their profile record from active routes."
        confirmText="Delete Account"
        isDestructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteClient(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
