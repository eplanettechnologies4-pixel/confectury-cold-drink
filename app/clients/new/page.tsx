'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ShoppingCart, Building, Phone, MapPin, CreditCard, Layers } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { CustomerType, PaymentTerms, PartyCategory } from '@/types';
import { BUSINESS_CONFIG } from '@/lib/utils';

export default function AddClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addClient, areas } = useAppState();

  const areaParam = searchParams.get('area') || '';

  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    clientType: 'Retailer' as CustomerType,
    partyCategory: 'B' as PartyCategory,
    phone: '',
    alternatePhone: '',
    email: '',
    taxId: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Suspended',
    area: areaParam || (areas[0]?.name || 'Madina Town'),
    areaId: areas.find(a => a.name === (areaParam || areas[0]?.name))?.id || '',
    address: {
      address: '',
      city: 'Faisalabad',
      area: areaParam || (areas[0]?.name || 'Madina Town'),
      postalCode: '38000',
    },
    salesRep: areas[0]?.assignedSalesperson || 'Hamza Farooq',
    creditLimit: 50000,
    paymentTerms: '15 Days' as PaymentTerms,
    openingBalance: 0,
    balanceType: 'Receivable' as 'Receivable' | 'Payable',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (areaParam) {
      const matched = areas.find(a => a.name.toLowerCase() === areaParam.toLowerCase());
      if (matched) {
        setFormData(prev => ({
          ...prev,
          area: matched.name,
          areaId: matched.id,
          address: { ...prev.address, area: matched.name },
          salesRep: matched.assignedSalesperson || prev.salesRep,
        }));
      }
    }
  }, [areaParam, areas]);

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

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.companyName.trim()) errs.companyName = 'Shop / Business name is required';
    if (!formData.name.trim()) errs.name = 'Owner / Contact person name is required';
    if (!formData.phone.trim()) errs.phone = 'Primary phone number is required (e.g. 03057165320)';
    if (!formData.address.address.trim()) errs.address = 'Shop / Street address is required';
    if (!formData.area.trim()) errs.area = 'Distribution area is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (createOrderAfter = false) => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const created = addClient(formData);
      setIsSubmitting(false);

      if (createOrderAfter) {
        router.push(`/orders/new?clientId=${created.id}`);
      } else {
        router.push(areaParam ? `/sales/area?area=${encodeURIComponent(formData.area)}` : '/clients');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Failed to create party profile.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href={areaParam ? `/sales/area?area=${encodeURIComponent(areaParam)}` : '/clients'}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Add Customer / Party</h1>
            <p className="text-xs text-slate-500">
              Register a distribution customer in {formData.area || 'Faisalabad'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Save Customer</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Save & Make Sale</span>
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-erp p-6 space-y-6">
        {/* Section 1: Business & Owner Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
            <Building className="h-4 w-4 mr-2 text-brand-600" /> 1. Customer & Shop Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop / Business Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Bismillah Cash & Carry"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                  errors.companyName ? 'border-rose-500' : 'border-slate-300'
                } rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
              />
              {errors.companyName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.companyName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner / Contact Person *
              </label>
              <input
                type="text"
                placeholder="e.g. Haji Bismillah Khan"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                  errors.name ? 'border-rose-500' : 'border-slate-300'
                } rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-0.5">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone Number * (e.g. 03057165320)
              </label>
              <input
                type="text"
                placeholder="03001234567"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                  errors.phone ? 'border-rose-500' : 'border-slate-300'
                } rounded-lg focus:bg-white focus:outline-none focus:ring-2`}
              />
              {errors.phone && <p className="text-[11px] text-rose-500 mt-0.5">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alternate Phone Number (Optional)
              </label>
              <input
                type="text"
                placeholder="03219876543"
                value={formData.alternatePhone}
                onChange={e => setFormData({ ...formData, alternatePhone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Party Classification Category *
              </label>
              <select
                value={formData.partyCategory}
                onChange={e => setFormData({ ...formData, partyCategory: e.target.value as PartyCategory })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none font-semibold text-brand-700"
              >
                <option value="A">Category A - High Volume Buyer</option>
                <option value="B">Category B - Medium Volume Buyer</option>
                <option value="C">Category C - Low Volume / Cash Buyer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Type
              </label>
              <select
                value={formData.clientType}
                onChange={e => setFormData({ ...formData, clientType: e.target.value as CustomerType })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              >
                <option value="Supermarket">Supermarket</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Retailer">Retailer / Karyana Store</option>
                <option value="Distributor">Distributor / Agency</option>
                <option value="Hotel/Restaurant">Hotel / Restaurant / Canteen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Area & Address */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
            <MapPin className="h-4 w-4 mr-2 text-brand-600" /> 2. Distribution Route & Area Assignment
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Distribution Area *
              </label>
              <select
                value={formData.area}
                onChange={e => handleAreaChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-brand-50/50 border border-brand-300 rounded-lg focus:bg-white font-semibold text-slate-900"
              >
                {areas.map(a => (
                  <option key={a.id} value={a.name}>
                    {a.name} ({a.code}) - Rep: {a.assignedSalesperson || 'None'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Salesperson / Route Rep
              </label>
              <input
                type="text"
                value={formData.salesRep}
                onChange={e => setFormData({ ...formData, salesRep: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop / Street Address *
              </label>
              <input
                type="text"
                placeholder="e.g. Shop # 14, Main Boulevard, Near Gol Masjid"
                value={formData.address.address}
                onChange={e =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, address: e.target.value },
                  })
                }
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                  errors.address ? 'border-rose-500' : 'border-slate-300'
                } rounded-lg focus:bg-white focus:outline-none`}
              />
              {errors.address && <p className="text-[11px] text-rose-500 mt-0.5">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Credit Terms & Balance */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
            <CreditCard className="h-4 w-4 mr-2 text-brand-600" /> 3. Market Credit & Financial Terms
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Credit Limit (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={formData.creditLimit}
                onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={e => setFormData({ ...formData, paymentTerms: e.target.value as PaymentTerms })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              >
                <option value="Cash">Cash On Delivery (COD)</option>
                <option value="7 Days">7 Days Weekly Cycle</option>
                <option value="15 Days">15 Days Fortnightly</option>
                <option value="30 Days">30 Days Monthly</option>
                <option value="Custom">Custom Agreed Terms</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Balance (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={formData.openingBalance}
                onChange={e => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Party Notes / Chiller Details / Delivery Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Has Ahmad Traders branded counter chiller. Delivery timings 10 AM - 1 PM."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
