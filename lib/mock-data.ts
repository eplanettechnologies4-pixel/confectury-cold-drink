import {
  Client,
  Product,
  Order,
  Payment,
  Staff,
  LedgerEntry,
  InventoryTransaction,
  AuditLog,
  Area,
  Supplier,
  Purchase,
  Expense,
  DailyClosing,
  BadDebt,
  DamagedStockRecord,
  ExpiryRecord,
} from '@/types';

export const INITIAL_STAFF: Staff[] = [
  {
    id: '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf',
    employeeId: 'EMP-001',
    name: 'Ahmad Raza',
    email: 'ahmad.raza@ahmadtraders.pk',
    phone: '03057165320',
    role: 'Admin',
    department: 'Executive Management',
    joiningDate: '2021-01-01',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_AREAS: Area[] = [
  {
    id: 'area-1',
    code: 'MDT',
    name: 'Madina Town',
    description: 'Madina Town Main Boulevard, Susan Road connecting markets & residential shops',
    assignedSalesperson: 'Ahmad Raza',
    status: 'Active',
    createdAt: '2023-01-01',
  },
  {
    id: 'area-2',
    code: 'DGD',
    name: 'D-Ground',
    description: 'D-Ground Commercial Area, Peoples Colony No. 1, Chenab Market',
    assignedSalesperson: 'Ahmad Raza',
    status: 'Active',
    createdAt: '2023-01-01',
  },
  {
    id: 'area-3',
    code: 'SSN',
    name: 'Susan Road',
    description: 'Susan Road Commercial Area & surrounding bakery markets',
    assignedSalesperson: 'Ahmad Raza',
    status: 'Active',
    createdAt: '2023-01-05',
  },
  {
    id: 'area-4',
    code: 'SMN',
    name: 'Samanabad',
    description: 'Samanabad Main Bazaar, Novelty Chowk, Dijkot Road retail belt',
    assignedSalesperson: 'Ahmad Raza',
    status: 'Active',
    createdAt: '2023-01-10',
  },
  {
    id: 'area-5',
    code: 'JRN',
    name: 'Jaranwala Road',
    description: 'Jaranwala Road retail shops, Kohinoor City, Al-Fateh vicinity',
    assignedSalesperson: 'Ahmad Raza',
    status: 'Active',
    createdAt: '2023-01-15',
  },
  {
    id: 'area-6',
    code: 'GMA',
    name: 'Ghulam Muhammad Abad',
    description: 'GM Abad Main Bazar, Siddiqia Hospital Road confectionery cluster',
    assignedSalesperson: 'Ahmad Raza',
    status: 'Active',
    createdAt: '2023-02-01',
  },
  {
    id: 'area-7',
    code: 'KOT',
    name: 'Kotwali Road',
    description: 'Wholesale market cluster, Rail Bazaar, Karkhana Bazaar',
    assignedSalesperson: 'Ahmad Raza',
    status: 'Active',
    createdAt: '2023-02-15',
  },
];

// Start 100% clean from 0 as requested by the user
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_PURCHASES: Purchase[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_DAILY_CLOSINGS: DailyClosing[] = [];
export const INITIAL_STOCK_TRANSACTIONS: InventoryTransaction[] = [];
export const INITIAL_BAD_DEBTS: BadDebt[] = [];
export const INITIAL_DAMAGED_STOCK: DamagedStockRecord[] = [];
export const INITIAL_EXPIRY_RECORDS: ExpiryRecord[] = [];
export const INITIAL_LEDGER_ENTRIES: Record<string, LedgerEntry[]> = {};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '02-10-2026 12:00 PM',
    user: 'Ahmad Raza',
    action: 'System Startup',
    module: 'System',
    recordRef: 'RESET-001',
    details: 'Ahmad Traders Confectionery & Cold Drinks Distribution ERP initialized with 0 records. Ready for custom products and operations.',
  },
];
