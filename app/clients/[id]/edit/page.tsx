'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Building, Phone, MapPin, CreditCard } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { CustomerType, PaymentTerms, PartyCategory } from '@/types';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;
  const { clients, updateClient, areas } = useAppState();

  const targetClient = clients.find(c => c.id === clientId || c.clientId === clientId);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    clientType: 'Retailer' as CustomerType,
    partyCategory: 'B' as PartyCategory,
    phone: '',
    alternatePhone: '',
    email: '',
    taxId: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Suspended',
    area: 'Madina Town',
    areaId: '',
    address: {
      address: '',
      city: 'Faisalabad',
      area: 'Madina Town',
      postalCode: '38000',
    },
    salesRep: '',
    creditLimit: 0,
    paymentTerms: '15 Days' as PaymentTerms,
    notes: '',
  });

  useEffect(() => {
    if (targetClient) {
      setFormData({
        name: targetClient.name,
        companyName: targetClient.companyName,
        clientType: targetClient.clientType,
        partyCategory: targetClient.partyCategory || 'B',
        phone: targetClient.phone,
        alternatePhone: targetClient.alternatePhone || '',
        email: targetClient.email || '',
        taxId: targetClient.taxId || '',
        status: targetClient.status,
        area: targetClient.area || 'Madina Town',
        areaId: targetClient.areaId || '',
        address: {
          address: targetClient.address?.address || '',
          city: targetClient.address?.city || 'Faisalabad',
          area: targetClient.area || targetClient.address?.area || 'Madina Town',
          postalCode: targetClient.address?.postalCode || '38000',
        },
        salesRep: targetClient.salesRep,
        creditLimit: targetClient.creditLimit,
        paymentTerms: targetClient.paymentTerms,
        notes: targetClient.notes || '',
      });
    }
  }, [targetClient]);

  if (!targetClient) {
    return <div className="p-8 text-center text-slate-500">Customer profile not found.</div>;
  }

  const handleAreaChange = (areaName: string) => {
    const matched = areas.find(a => a.name === areaName);
    setFormData(prev => ({
      ...prev,
      area: areaName,
      areaId: matched?.id || '',
      address: { ...prev.address, area: areaName },
      salesRep: matched?.assignedSalesperson || prev.salesRep,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateClient(targetClient.id, formData);
    router.push(`/clients/${targetClient.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href={`/clients/${targetClient.id}`} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Customer — {targetClient.companyName}</h1>
            <p className="text-xs text-slate-500">Update party details, route area, and credit terms.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl shadow-erp p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
            <Building className="h-4 w-4 mr-2 text-brand-600" /> 1. Customer Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shop / Business Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Contact Person</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Classification</label>
              <select
                value={formData.partyCategory}
                onChange={e => setFormData({ ...formData, partyCategory: e.target.value as PartyCategory })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-brand-700"
              >
                <option value="A">Category A - High Volume Buyer</option>
                <option value="B">Category B - Medium Volume Buyer</option>
                <option value="C">Category C - Low Volume / Cash Buyer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Type</label>
              <select
                value={formData.clientType}
                onChange={e => setFormData({ ...formData, clientType: e.target.value as CustomerType })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Supermarket">Supermarket</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Retailer">Retailer / Karyana</option>
                <option value="Distributor">Distributor</option>
                <option value="Hotel/Restaurant">Hotel / Restaurant / Canteen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Phone Number (e.g. 03057165320)</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Phone</label>
              <input
                type="text"
                value={formData.alternatePhone}
                onChange={e => setFormData({ ...formData, alternatePhone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax ID / NTN / CNIC</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Area & Address */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
            <MapPin className="h-4 w-4 mr-2 text-brand-600" /> 2. Distribution Route & Location
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Distribution Area</label>
              <select
                value={formData.area}
                onChange={e => handleAreaChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-brand-50 border border-brand-300 rounded-lg font-bold"
              >
                {areas.map(a => (
                  <option key={a.id} value={a.name}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Salesperson</label>
              <input
                type="text"
                value={formData.salesRep}
                onChange={e => setFormData({ ...formData, salesRep: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Address</label>
              <input
                type="text"
                value={formData.address.address}
                onChange={e => setFormData({ ...formData, address: { ...formData.address, address: e.target.value } })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Credit & Notes */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
            <CreditCard className="h-4 w-4 mr-2 text-brand-600" /> 3. Credit Terms & Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (PKR)</label>
              <input
                type="number"
                min="0"
                value={formData.creditLimit}
                onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={formData.paymentTerms}
                onChange={e => setFormData({ ...formData, paymentTerms: e.target.value as PaymentTerms })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Cash">Cash on Delivery</option>
                <option value="7 Days">7 Days</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
