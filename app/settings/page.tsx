'use client';

import React, { useState } from 'react';
import { Settings, ShieldCheck, Store, Save, History, FileText, MapPin, Phone, Layers, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { AuditLog } from '@/types';
import { BUSINESS_CONFIG } from '@/lib/utils';

export default function SettingsPage() {
  const { auditLogs, resetAllData } = useAppState();
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'audit'>('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({
    companyName: BUSINESS_CONFIG.name,
    tagline: BUSINESS_CONFIG.subtitle,
    address: BUSINESS_CONFIG.address,
    phone1: BUSINESS_CONFIG.phone1,
    phone2: BUSINESS_CONFIG.phone2,
    email: 'info@ahmadtraders.pk',
    currency: 'PKR',
    currencySymbol: 'Rs.',
    timezone: 'Asia/Karachi',
    dateFormat: 'DD-MM-YYYY',
    invoiceFooterNote: 'Thank you for your business with Ahmad Traders. All credit purchases are governed by agreed distribution terms.',
  });

  const [categoryDefinitions, setCategoryDefinitions] = useState({
    catA: 'High-Volume Wholesale & Supermarket Accounts',
    catB: 'Medium-Volume Regular Retail & Karyana Stores',
    catC: 'Low-Volume Corner Kiosks & Cash on Delivery Customers',
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      cell: (a) => <span className="font-mono text-xs text-slate-500 whitespace-nowrap">{a.timestamp}</span>,
    },
    {
      header: 'User',
      cell: (a) => <span className="font-bold text-slate-900 text-xs">{a.user}</span>,
    },
    {
      header: 'Module',
      cell: (a) => (
        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
          {a.module}
        </span>
      ),
    },
    {
      header: 'Action',
      cell: (a) => <span className="font-semibold text-brand-600 text-xs">{a.action}</span>,
    },
    {
      header: 'Record Ref',
      cell: (a) => <span className="font-mono text-xs text-slate-700">{a.recordRef}</span>,
    },
    {
      header: 'Audit Event Details',
      cell: (a) => <span className="text-xs text-slate-600">{a.details}</span>,
    },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Audit Trail</h1>
          <p className="text-xs text-slate-500">Configure business information, distribution classifications, and review compliance logs.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-t-xl px-6 pt-4 border-b-0">
        <div className="flex space-x-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-semibold capitalize transition border-b-2 ${
              activeTab === 'profile' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Business Profile & Defaults
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 text-xs font-semibold capitalize transition border-b-2 ${
              activeTab === 'categories' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Party Category Definitions (A/B/C)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-xs font-semibold capitalize transition border-b-2 ${
              activeTab === 'audit' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            System Audit Log ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-erp p-6 space-y-6 text-xs">
          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
              System business settings saved successfully.
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
              <Store className="h-4 w-4 mr-2 text-brand-600" /> Ahmad Traders Entity Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={companyInfo.companyName}
                  onChange={e => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Subtitle / Tagline</label>
                <input
                  type="text"
                  value={companyInfo.tagline}
                  onChange={e => setCompanyInfo({ ...companyInfo, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Warehouse & Office Address</label>
                <input
                  type="text"
                  value={companyInfo.address}
                  onChange={e => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Phone Number</label>
                <input
                  type="text"
                  value={companyInfo.phone1}
                  onChange={e => setCompanyInfo({ ...companyInfo, phone1: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Second Contact Number</label>
                <input
                  type="text"
                  value={companyInfo.phone2}
                  onChange={e => setCompanyInfo({ ...companyInfo, phone2: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Code & Symbol</label>
                <input
                  type="text"
                  disabled
                  value={`${companyInfo.currency} (${companyInfo.currencySymbol})`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Timezone & Date Format</label>
                <input
                  type="text"
                  disabled
                  value={`${companyInfo.timezone} • ${companyInfo.dateFormat}`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
              <FileText className="h-4 w-4 mr-2 text-brand-600" /> Invoice & Statement Print Settings
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Footer Terms & Remarks</label>
              <textarea
                rows={2}
                value={companyInfo.invoiceFooterNote}
                onChange={e => setCompanyInfo({ ...companyInfo, invoiceFooterNote: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Reset Portal Data Box */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Reset Portal & Wipe All Data (Start from 0)</span>
            </div>
            <p className="text-xs text-rose-700">
              Permanently wipe all demo/test data (products, customers, orders, purchases, payments, expenses, and inventory transactions) to start completely clean with 0 records.
            </p>
            {isResetSuccess && (
              <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded text-emerald-800 font-semibold">
                ✓ All portal data has been wiped clean. System is at 0 records.
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Wipe All Data / Reset to 0</span>
            </button>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
            >
              <Save className="h-4 w-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'categories' ? (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-erp p-6 space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
              <Layers className="h-4 w-4 mr-2 text-brand-600" /> Configurable Party A / B / C Classifications
            </h3>
            <p className="text-slate-600">
              Customize the operational criteria for customer classifications. These definitions are referenced across Area-wise sales, credit management, and receivable reports.
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-900 text-sm">Category A — High Volume Accounts</span>
                  <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-[10px] font-bold rounded">Category A</span>
                </div>
                <input
                  type="text"
                  value={categoryDefinitions.catA}
                  onChange={e => setCategoryDefinitions({ ...categoryDefinitions, catA: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs"
                />
                <p className="text-[11px] text-purple-700">Top-tier wholesale points, supermarkets, and major distributors with large credit lines.</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-900 text-sm">Category B — Medium Volume Accounts</span>
                  <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-[10px] font-bold rounded">Category B</span>
                </div>
                <input
                  type="text"
                  value={categoryDefinitions.catB}
                  onChange={e => setCategoryDefinitions({ ...categoryDefinitions, catB: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs"
                />
                <p className="text-[11px] text-blue-700">Regular neighborhood karyana stores and bakery chillers with 7-to-15 day credit cycles.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-sm">Category C — Low Volume Accounts</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">Category C</span>
                </div>
                <input
                  type="text"
                  value={categoryDefinitions.catC}
                  onChange={e => setCategoryDefinitions({ ...categoryDefinitions, catC: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <p className="text-[11px] text-slate-600">Street kiosks, corner tea shops, and cash-on-delivery buyers with minimal credit.</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSave}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs"
              >
                <Save className="h-4 w-4" />
                <span>Save Category Definitions</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={auditLogs}
          searchPlaceholder="Search audit log..."
          searchField={(a) => `${a.user} ${a.action} ${a.module} ${a.recordRef} ${a.details}`}
        />
      )}

      {/* Confirm Wipe Modal */}
      {isResetModalOpen && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title="Confirm Portal Reset to 0"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Wipe all records and start from 0?</p>
                <p className="text-xs text-rose-700 mt-1">
                  This will remove all products, customers, invoices, purchases, payments, and stock movements. Your admin login and distribution routes will remain preserved.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setIsResetModalOpen(false);
                  setIsResetSuccess(true);
                  setTimeout(() => setIsResetSuccess(false), 4000);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Yes, Wipe Everything
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
