'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  ChevronLeft,
  X,
  Store,
  Layers,
  CalendarCheck,
  AlertTriangle,
  RotateCcw,
  MapPin,
  FileSpreadsheet,
  Receipt,
  Banknote,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Building2,
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { BUSINESS_CONFIG } from '@/lib/utils';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  subItems?: { title: string; href: string; icon?: React.ElementType }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Package,
    subItems: [
      { title: 'Products', href: '/inventory/products' },
      { title: 'Stock Overview', href: '/inventory' },
      { title: 'Stock Movements', href: '/inventory/history' },
      { title: 'Daily Closing Stock', href: '/inventory/closing' },
      { title: 'Expiry & Damaged Stock', href: '/inventory/expiry-damage' },
    ],
  },
  {
    title: 'Sales',
    href: '/orders',
    icon: ShoppingCart,
    subItems: [
      { title: 'Daily Sales', href: '/orders' },
      { title: 'New Sale Invoice', href: '/orders/new' },
      { title: 'Sales Returns', href: '/sales/returns' },
      { title: 'Party-wise Sales', href: '/sales/party' },
      { title: 'Area-wise Sales', href: '/sales/area' },
    ],
  },
  {
    title: 'Purchases',
    href: '/purchases',
    icon: Truck,
    subItems: [
      { title: 'Daily Purchases', href: '/purchases' },
      { title: 'New Purchase', href: '/purchases/new' },
      { title: 'Purchase Returns', href: '/purchases/returns' },
      { title: 'Suppliers', href: '/purchases/suppliers' },
    ],
  },
  {
    title: 'Parties',
    href: '/clients',
    icon: Users,
    subItems: [
      { title: 'Customers / Parties', href: '/clients' },
      { title: 'Add Customer', href: '/clients/new' },
      { title: 'Areas', href: '/parties/areas' },
      { title: 'Party Statements', href: '/parties/statements' },
      { title: 'Market Credit', href: '/parties/credit' },
      { title: 'Collections', href: '/accounts/payments' },
    ],
  },
  {
    title: 'Finance',
    href: '/finance/expenses',
    icon: Banknote,
    subItems: [
      { title: 'Daily Expenses', href: '/finance/expenses' },
      { title: 'Bad Debts', href: '/finance/bad-debts' },
      { title: 'Profit & Loss', href: '/finance/profit-loss' },
    ],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    subItems: [
      { title: 'Sales Reports', href: '/reports?tab=sales' },
      { title: 'Purchase Reports', href: '/reports?tab=purchases' },
      { title: 'Stock Reports', href: '/reports?tab=stock' },
      { title: 'Credit Reports', href: '/reports?tab=credit' },
      { title: 'Expense Reports', href: '/reports?tab=expenses' },
      { title: 'Profit & Loss Reports', href: '/reports?tab=pnl' },
      { title: 'Area Reports', href: '/reports?tab=areas' },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    subItems: [
      { title: 'Business Settings', href: '/settings' },
      { title: 'Users & Staff', href: '/staff' },
      { title: 'Roles & Permissions', href: '/staff/roles' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const { currentUser, logout } = useAppState();

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    Inventory: pathname.startsWith('/inventory'),
    Sales: pathname.startsWith('/orders') || pathname.startsWith('/sales'),
    Purchases: pathname.startsWith('/purchases'),
    Parties: pathname.startsWith('/clients') || pathname.startsWith('/parties') || pathname.startsWith('/accounts'),
    Finance: pathname.startsWith('/finance'),
    Reports: pathname.startsWith('/reports'),
    Settings: pathname.startsWith('/settings') || pathname.startsWith('/staff'),
  });

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const userRole = currentUser?.role || 'Admin';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center space-x-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 flex-shrink-0">
            <Store className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="text-base font-extrabold tracking-tight text-white block truncate leading-tight">
                {BUSINESS_CONFIG.name}
              </span>
              <span className="block text-[9px] uppercase font-semibold text-emerald-400 tracking-wider truncate">
                Confectionery & Cold Drinks
              </span>
            </div>
          )}
        </Link>

        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {onToggleCollapse && !onMobileClose && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Business Location Info Pill */}
      {!isCollapsed && (
        <div className="px-3 pt-2.5 pb-1">
          <div className="px-2.5 py-1.5 bg-slate-800/60 rounded-md border border-slate-700/60 text-[10px] text-slate-400 flex items-center space-x-1.5">
            <MapPin className="h-3 w-3 text-emerald-400 flex-shrink-0" />
            <span className="truncate">Tezab Mills Road, Faisalabad</span>
          </div>
        </div>
      )}

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-1">
        {NAV_ITEMS.map(item => {
          if (item.roles && !item.roles.includes(userRole) && userRole !== 'Admin') {
            return null;
          }

          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
            (item.title === 'Sales' && (pathname.startsWith('/orders') || pathname.startsWith('/sales'))) ||
            (item.title === 'Parties' && (pathname.startsWith('/clients') || pathname.startsWith('/parties'))) ||
            (item.title === 'Finance' && pathname.startsWith('/finance'));

          const hasSub = item.subItems && item.subItems.length > 0;
          const isSubOpen = openSubMenus[item.title];

          return (
            <div key={item.title}>
              {hasSub && !isCollapsed ? (
                <div>
                  <button
                    onClick={() => toggleSubMenu(item.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.title}</span>
                    </div>
                    {isSubOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Submenu items */}
                  {isSubOpen && (
                    <div className="ml-5 mt-1 space-y-0.5 border-l border-slate-800 pl-2">
                      {item.subItems?.map(sub => {
                        const isSubActive = pathname === sub.href || (sub.href.includes('?') && pathname === sub.href.split('?')[0]);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={onMobileClose}
                            className={`block px-2.5 py-1.5 rounded-md text-[11px] font-medium transition ${
                              isSubActive
                                ? 'text-emerald-400 font-bold bg-slate-800/70'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                            }`}
                          >
                            {sub.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* User Footer Card & Logout */}
      <div className="p-2.5 border-t border-slate-800">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-850">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {currentUser?.name.charAt(0) || 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Admin'}</p>
                <p className="text-[10px] text-emerald-400 truncate">{currentUser?.role || 'Admin'} • Faisalabad</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Logout"
            className="w-full flex justify-center p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block h-screen sticky top-0 z-30 transition-all duration-300 print:hidden ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="fixed inset-y-0 left-0 w-64 shadow-2xl">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
