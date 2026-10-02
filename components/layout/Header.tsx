'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronRight,
  ShieldCheck,
  Package,
  Users,
  ShoppingCart,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { StaffRole } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, login, clients, products, orders } = useAppState();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Generate breadcrumbs from path
  const segments = pathname.split('/').filter(Boolean);

  const getBreadcrumbTitle = (segment: string) => {
    if (segment === 'dashboard') return 'Dashboard';
    if (segment === 'clients') return 'Clients';
    if (segment === 'inventory') return 'Inventory';
    if (segment === 'products') return 'Products';
    if (segment === 'stock-in') return 'Stock In';
    if (segment === 'stock-out') return 'Stock Out';
    if (segment === 'history') return 'History';
    if (segment === 'orders') return 'Orders';
    if (segment === 'accounts') return 'Accounts';
    if (segment === 'payments') return 'Payments';
    if (segment === 'staff') return 'Staff';
    if (segment === 'roles') return 'Roles & Permissions';
    if (segment === 'reports') return 'Reports';
    if (segment === 'settings') return 'Settings';
    if (segment === 'new') return 'Create New';
    if (segment === 'edit') return 'Edit';
    if (segment === 'ledger') return 'Ledger';
    return segment.toUpperCase();
  };

  const handleRoleSwitch = (newRole: StaffRole) => {
    if (currentUser) {
      login(currentUser.email, newRole);
    }
    setIsProfileOpen(false);
  };

  // Search matches
  const matchedClients = searchQuery.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.companyName.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const matchedProducts = searchQuery.trim()
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const matchedOrders = searchQuery.trim()
    ? orders.filter(o => o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || o.companyName.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between shadow-xs print:hidden">
        {/* Left Section: Mobile Menu & Breadcrumbs */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-brand-600 font-medium">
              Ahmad Traders
            </Link>
            {segments.map((seg, idx) => {
              const url = '/' + segments.slice(0, idx + 1).join('/');
              const isLast = idx === segments.length - 1;
              return (
                <React.Fragment key={url}>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  {isLast ? (
                    <span className="font-semibold text-slate-800">{getBreadcrumbTitle(seg)}</span>
                  ) : (
                    <Link href={url} className="hover:text-brand-600 font-medium">
                      {getBreadcrumbTitle(seg)}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Global Search, Notifications, Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center space-x-2 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs text-slate-500 transition w-48 lg:w-64"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="flex-1 text-left">Search clients, SKU...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white"></span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-erp-dropdown py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Notifications</span>
                  <span className="px-1.5 py-0.5 bg-brand-50 text-brand-600 font-bold rounded-full text-[10px]">
                    3 New
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition cursor-pointer">
                    <p className="font-semibold text-slate-800">Low Stock Warning</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Red Bull Energy Drink stock fell below minimum limit (18 left).
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition cursor-pointer">
                    <p className="font-semibold text-slate-800">New Order Confirmed</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Metro Wholesale created order #ORD-8820 (Rs. 5,800).
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">1 hour ago</span>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition cursor-pointer">
                    <p className="font-semibold text-slate-800">Payment Received</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Received payment of Rs. 2,000 from City Super Mart.
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">3 hours ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown & Role Tester */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {currentUser?.name.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser?.name || 'Alexander Wright'}
                </span>
                <span className="block text-[10px] font-medium text-brand-600">
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-erp-dropdown py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{currentUser?.name}</p>
                  <p className="text-slate-500 text-[11px] truncate">{currentUser?.email}</p>
                </div>

                {/* Demo Role Switcher Section */}
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center">
                    <ShieldCheck className="h-3 w-3 mr-1 text-brand-500" /> Switch Role Mode:
                  </p>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {(['Admin', 'Manager', 'Sales', 'Accounts', 'Inventory'] as StaffRole[]).map(r => (
                      <button
                        key={r}
                        onClick={() => handleRoleSwitch(r)}
                        className={`px-2 py-1 rounded text-[10px] text-left font-medium transition ${
                          currentUser?.role === r
                            ? 'bg-brand-600 text-white font-bold'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Global Quick Search"
        subtitle="Search across Clients, Products, and Orders"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Type client name, product SKU, or order #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              autoFocus
            />
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pt-2">
            {/* Clients Results */}
            {matchedClients.length > 0 && (
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center">
                  <Users className="h-3 w-3 mr-1" /> Clients
                </p>
                <div className="space-y-1">
                  {matchedClients.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        router.push(`/clients/${c.id}`);
                      }}
                      className="p-2 bg-slate-50 hover:bg-brand-50 rounded-lg cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{c.companyName}</p>
                        <p className="text-[10px] text-slate-500">{c.name} • {c.clientId}</p>
                      </div>
                      <span className="text-xs font-medium text-brand-600">Rs. {c.currentBalance.toLocaleString()} bal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Results */}
            {matchedProducts.length > 0 && (
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center">
                  <Package className="h-3 w-3 mr-1" /> Products
                </p>
                <div className="space-y-1">
                  {matchedProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        router.push(`/inventory/products`);
                      }}
                      className="p-2 bg-slate-50 hover:bg-brand-50 rounded-lg cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-500">SKU: {p.sku} • Stock: {p.currentStock}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-700">Rs. {p.sellingPrice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Results */}
            {matchedOrders.length > 0 && (
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center">
                  <ShoppingCart className="h-3 w-3 mr-1" /> Orders
                </p>
                <div className="space-y-1">
                  {matchedOrders.map(o => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        router.push(`/orders`);
                      }}
                      className="p-2 bg-slate-50 hover:bg-brand-50 rounded-lg cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{o.orderNumber} - {o.companyName}</p>
                        <p className="text-[10px] text-slate-500">{o.orderDate} • Status: {o.status}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-700">Rs. {o.grandTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.trim() && matchedClients.length === 0 && matchedProducts.length === 0 && matchedOrders.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No matching records found for "{searchQuery}".</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
