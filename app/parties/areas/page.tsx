'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Edit3, Users, ArrowRight, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Area } from '@/types';
import { BUSINESS_CONFIG } from '@/lib/utils';

export default function AreasManagementPage() {
  const { areas, addArea, updateArea, toggleAreaStatus, clients, orders } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    assignedSalesperson: 'Admin',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const openAddModal = () => {
    setEditingArea(null);
    setFormData({
      code: `ARA-${areas.length + 1}`,
      name: '',
      description: '',
      assignedSalesperson: 'Admin',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (area: Area) => {
    setEditingArea(area);
    setFormData({
      code: area.code,
      name: area.name,
      description: area.description || '',
      assignedSalesperson: area.assignedSalesperson || '',
      status: area.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArea) {
      updateArea(editingArea.id, formData);
    } else {
      addArea(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Distribution Area Management</h1>
          <p className="text-xs text-slate-500">
            Configure sales territories, delivery routes, and assign sales representatives across Faisalabad.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Distribution Area</span>
        </button>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {areas.map(area => {
          const areaClients = clients.filter(c => c.area === area.name);
          const catACount = areaClients.filter(c => c.partyCategory === 'A').length;
          const catBCount = areaClients.filter(c => c.partyCategory === 'B').length;
          const catCCount = areaClients.filter(c => c.partyCategory === 'C').length;
          const totalAreaReceivable = areaClients.reduce((sum, c) => sum + c.currentBalance, 0);

          return (
            <div
              key={area.id}
              className={`bg-white rounded-xl border p-5 shadow-erp transition flex flex-col justify-between ${
                area.status === 'Active' ? 'border-slate-200 hover:border-brand-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{area.name}</h3>
                      <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                        CODE: {area.code}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      area.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {area.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px]">
                  {area.description || 'Faisalabad distribution route and customer network.'}
                </p>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Route Salesperson:</span>
                    <span className="font-semibold text-slate-900">{area.assignedSalesperson || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Customers:</span>
                    <span className="font-bold font-mono text-slate-900">{areaClients.length}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px]">
                    <span className="text-slate-500">Party Breakdown:</span>
                    <div className="flex space-x-1.5 font-bold font-mono text-[10px]">
                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded" title="Category A">{catACount} A</span>
                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded" title="Category B">{catBCount} B</span>
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded" title="Category C">{catCCount} C</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span>Market Credit:</span>
                    <span className={`font-mono font-bold ${totalAreaReceivable > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      Rs. {totalAreaReceivable.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(area)}
                    className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-md"
                    title="Edit Area"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleAreaStatus(area.id)}
                    className={`p-1.5 rounded-md ${
                      area.status === 'Active' ? 'text-slate-400 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                    title={area.status === 'Active' ? 'Deactivate Area' : 'Activate Area'}
                  >
                    {area.status === 'Active' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </button>
                </div>

                <Link
                  href={`/sales/area?area=${encodeURIComponent(area.name)}`}
                  className="inline-flex items-center space-x-1 text-brand-600 hover:text-brand-700 font-bold"
                >
                  <span>Area Sales & Summary</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Area Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArea ? `Edit Area: ${editingArea.name}` : 'Add New Distribution Area'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Area Name * (e.g. Madina Town)</label>
            <input
              type="text"
              placeholder="e.g. Madina Town / Susan Road / D-Ground"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Area Code *</label>
              <input
                type="text"
                placeholder="e.g. MDT"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Salesperson / Route Representative</label>
            <input
              type="text"
              placeholder="e.g. Admin"
              value={formData.assignedSalesperson}
              onChange={e => setFormData({ ...formData, assignedSalesperson: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Area Description / Boundaries / Key Bazaars</label>
            <textarea
              rows={3}
              placeholder="e.g. Main Boulevard, Susan Road junction, Gol Masjid market cluster."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-xs"
            >
              {editingArea ? 'Save Area Changes' : 'Create Area'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
