'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserCheck, Plus, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Staff, StaffRole } from '@/types';

export default function StaffPage() {
  const { staff, addStaff } = useAppState();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales' as StaffRole,
    department: 'Sales & Distribution',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive',
  });

  const columns: Column<Staff>[] = [
    {
      header: 'Employee ID / Name',
      cell: (s) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
            {s.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{s.name}</span>
            <span className="font-mono text-[10px] text-slate-500">{s.employeeId}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Role Access',
      cell: (s) => <StatusBadge status={s.role} />,
    },
    {
      header: 'Department',
      cell: (s) => <span className="text-xs font-medium text-slate-700">{s.department}</span>,
    },
    {
      header: 'Contact Info',
      cell: (s) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-700">{s.email}</div>
          <div className="text-slate-400 text-[11px]">{s.phone}</div>
        </div>
      ),
    },
    {
      header: 'Joining Date',
      cell: (s) => <span className="text-xs text-slate-600">{s.joiningDate}</span>,
    },
    {
      header: 'Status',
      cell: (s) => <StatusBadge status={s.status} />,
    },
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStaff(formData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff & Team Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage company employees, system roles, and department assignments.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/staff/roles"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Roles & Permissions</span>
          </Link>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Staff Members</span>
          <span className="text-2xl font-extrabold text-slate-900">{staff.length} Active</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Sales Reps</span>
          <span className="text-2xl font-extrabold text-brand-600">{staff.filter(s => s.role === 'Sales').length} Reps</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Warehouse & Inventory</span>
          <span className="text-2xl font-extrabold text-amber-600">{staff.filter(s => s.role === 'Inventory').length} Officers</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-erp">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Finance & Accounts</span>
          <span className="text-2xl font-extrabold text-emerald-600">{staff.filter(s => s.role === 'Accounts').length} Officers</span>
        </div>
      </div>

      {/* Staff Table */}
      <DataTable
        columns={columns}
        data={staff}
        searchPlaceholder="Search staff by name, email, or role..."
        searchField={(s) => `${s.name} ${s.email} ${s.role} ${s.department}`}
        onAddClick={() => setIsAddModalOpen(true)}
        addLabel="Add Staff"
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Member"
        subtitle="Create a new employee account and assign role access"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Jessica Miller"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="j.miller@eplanet.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">System Role</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as StaffRole })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Sales">Sales</option>
                <option value="Accounts">Accounts</option>
                <option value="Inventory">Inventory</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
