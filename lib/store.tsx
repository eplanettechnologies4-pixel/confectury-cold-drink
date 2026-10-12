'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Staff,
  Client,
  Product,
  Order,
  Payment,
  LedgerEntry,
  InventoryTransaction,
  AuditLog,
  OrderStatus,
  StockMovementType,
  Area,
  Supplier,
  SupplierPayment,
  Purchase,
  PurchaseReturn,
  SalesReturn,
  DailyClosing,
  DailyClosingItem,
  Expense,
  BadDebt,
  BadDebtRecovery,
  DamagedStockRecord,
  ExpiryRecord,
} from '@/types';
import {
  INITIAL_STAFF,
  INITIAL_AREAS,
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_CLIENTS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_DAILY_CLOSINGS,
  INITIAL_STOCK_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BAD_DEBTS,
  INITIAL_DAMAGED_STOCK,
  INITIAL_EXPIRY_RECORDS,
} from './mock-data';
import { formatDateDDMMYYYY, getTodayKarachiDate, convertUnitQuantity } from './utils';
import { generateUUID } from './supabase/service';

interface AppStateContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (emailOrUser: string | User, role?: string) => boolean;
  logout: () => void;

  // Areas
  areas: Area[];
  addArea: (areaData: Omit<Area, 'id' | 'createdAt'>) => Area;
  updateArea: (id: string, areaData: Partial<Area>) => void;
  toggleAreaStatus: (id: string) => void;

  // Clients / Parties
  clients: Client[];
  addClient: (
    clientData: Omit<
      Client,
      'id' | 'clientId' | 'totalPurchases' | 'totalPaid' | 'currentBalance' | 'lastTransactionDate' | 'createdAt'
    >
  ) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'reservedStock' | 'availableStock' | 'status'>) => Product;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustProductStock: (productId: string, newStock: number, reason?: string) => void;

  // Suppliers & Supplier Payments
  suppliers: Supplier[];
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'supplierId' | 'currentPayable' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, supplierData: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  supplierPayments: SupplierPayment[];
  recordSupplierPayment: (paymentData: Omit<SupplierPayment, 'id' | 'paymentNumber'>) => SupplierPayment;

  // Purchases & Purchase Returns
  purchases: Purchase[];
  createPurchase: (purchaseData: Omit<Purchase, 'id' | 'invoiceNumber' | 'createdAt'>) => Purchase;
  postPurchase: (purchaseId: string) => boolean;
  purchaseReturns: PurchaseReturn[];
  recordPurchaseReturn: (returnData: Omit<PurchaseReturn, 'id' | 'returnNumber' | 'status'>) => PurchaseReturn;
  returnPurchase: (purchaseId: string, options?: { reason?: string }) => PurchaseReturn;

  // Sales Orders & Sales Returns
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => { success: boolean; order?: Order; error?: string };
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  salesReturns: SalesReturn[];
  recordSalesReturn: (returnData: Omit<SalesReturn, 'id' | 'returnNumber' | 'status'>) => SalesReturn;
  returnSale: (orderId: string, options?: { reason?: string; isResalable?: boolean; refundAmount?: number }) => SalesReturn;

  // Customer Collections & Receivables Ledger
  payments: Payment[];
  recordPayment: (paymentData: Omit<Payment, 'id' | 'paymentNumber' | 'status'>) => { success: boolean; payment?: Payment; error?: string };
  ledgerEntries: Record<string, LedgerEntry[]>;
  getLedgerForClient: (clientId: string) => LedgerEntry[];

  // Inventory Ledger
  inventoryTransactions: InventoryTransaction[];
  recordStockMovement: (
    productId: string,
    type: StockMovementType,
    quantity: number,
    reference: string,
    notes?: string,
    supplier?: string,
    warehouse?: string,
    unit?: string
  ) => void;

  // Daily Closing Stock & Reconciliation
  dailyClosings: DailyClosing[];
  getDailyClosingForDate: (date: string) => DailyClosing;
  saveDailyClosingCount: (date: string, items: DailyClosingItem[]) => void;
  closeBusinessDay: (date: string, closedBy: string) => boolean;
  reopenBusinessDay: (date: string, reopenedBy: string, reason: string) => boolean;
  isDateClosed: (date: string) => boolean;

  // Expenses
  expenses: Expense[];
  addExpense: (expenseData: Omit<Expense, 'id' | 'expenseNumber'>) => Expense;

  // Bad Debts & Recoveries
  badDebts: BadDebt[];
  requestBadDebt: (badDebtData: Omit<BadDebt, 'id' | 'badDebtNumber' | 'status'>) => BadDebt;
  approveBadDebt: (id: string, approvedBy: string) => void;
  badDebtRecoveries: BadDebtRecovery[];
  recordBadDebtRecovery: (recoveryData: Omit<BadDebtRecovery, 'id' | 'recoveryNumber'>) => BadDebtRecovery;

  // Expiry & Damaged Stock
  expiryRecords: ExpiryRecord[];
  writeOffExpiredStock: (recordId: string, quantity: number, reason: string) => void;
  damagedStockRecords: DamagedStockRecord[];
  recordDamagedStock: (damagedData: Omit<DamagedStockRecord, 'id' | 'totalLoss'>) => DamagedStockRecord;

  // Staff & Audit
  staff: Staff[];
  addStaff: (staffData: Omit<Staff, 'id' | 'employeeId'>) => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, module: AuditLog['module'], recordRef: string, details: string) => void;

  // System Data Reset
  resetAllData: () => void;

  // Supabase Sync
  supabaseSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  refreshFromSupabase: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Helper to load localStorage with automatic zero-reset check
function loadStored<T>(key: string, legacyKey: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    // If start-from-zero wipe flag is not yet recorded, purge all previous mock items
    if (!localStorage.getItem('ahmad_wiped_to_zero_v5')) {
      const keysToWipe = [
        'ahmad_current_user', 'eplanet_current_user',
        'ahmad_products', 'eplanet_products',
        'ahmad_clients', 'eplanet_clients',
        'ahmad_suppliers', 'eplanet_suppliers',
        'ahmad_supplier_payments', 'eplanet_supplier_payments',
        'ahmad_purchases', 'eplanet_purchases',
        'ahmad_purchase_returns', 'eplanet_purchase_returns',
        'ahmad_orders', 'eplanet_orders',
        'ahmad_sales_returns', 'eplanet_sales_returns',
        'ahmad_payments', 'eplanet_payments',
        'ahmad_ledgers', 'eplanet_ledgers',
        'ahmad_stock_tx', 'eplanet_stock_tx',
        'ahmad_daily_closings', 'eplanet_daily_closings',
        'ahmad_expenses', 'eplanet_expenses',
        'ahmad_bad_debts', 'eplanet_bad_debts',
        'ahmad_bad_debt_recoveries', 'eplanet_bad_debt_recoveries',
        'ahmad_expiry_records', 'eplanet_expiry_records',
        'ahmad_damaged_stock', 'eplanet_damaged_stock',
      ];
      keysToWipe.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('ahmad_wiped_to_zero_v5', 'true');
      return fallback;
    }
    const primary = localStorage.getItem(key);
    if (primary) return JSON.parse(primary);
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
  }
  return fallback;
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user - defaults to null so opening the app/dashboard requires login first
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const isRemembered = localStorage.getItem('ahmad_remember_session') === 'true';
      if (!isRemembered) {
        localStorage.removeItem('ahmad_current_user');
        localStorage.removeItem('eplanet_current_user');
        return null;
      }
      const stored = localStorage.getItem('ahmad_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          id: '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf',
          name: parsed.name && parsed.name !== 'Ahmad Raza' ? parsed.name : 'Admin',
          email: parsed.email && !parsed.email.includes('ahmad.raza') ? parsed.email : 'admin@ahmadtraders.pk',
          role: 'Admin' as const,
          department: parsed.department || 'Executive Management',
          avatarUrl: parsed.avatarUrl,
        };
      }
    } catch (e) {
      console.error('Failed to load user session:', e);
    }
    return null;
  });

  // Areas
  const [areas, setAreas] = useState<Area[]>(() => {
    return loadStored<Area[]>('ahmad_areas', 'eplanet_areas', INITIAL_AREAS);
  });

  // Clients
  const [clients, setClients] = useState<Client[]>(() => {
    return loadStored<Client[]>('ahmad_clients', 'eplanet_clients', INITIAL_CLIENTS);
  });

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    return loadStored<Product[]>('ahmad_products', 'eplanet_products', INITIAL_PRODUCTS);
  });

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    return loadStored<Supplier[]>('ahmad_suppliers', 'eplanet_suppliers', INITIAL_SUPPLIERS);
  });

  // Supplier Payments
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => {
    return loadStored<SupplierPayment[]>('ahmad_supplier_payments', 'eplanet_supplier_payments', []);
  });

  // Purchases
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    return loadStored<Purchase[]>('ahmad_purchases', 'eplanet_purchases', INITIAL_PURCHASES);
  });

  // Purchase Returns
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => {
    return loadStored<PurchaseReturn[]>('ahmad_purchase_returns', 'eplanet_purchase_returns', []);
  });

  // Sales Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    return loadStored<Order[]>('ahmad_orders', 'eplanet_orders', INITIAL_ORDERS);
  });

  // Sales Returns
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => {
    return loadStored<SalesReturn[]>('ahmad_sales_returns', 'eplanet_sales_returns', []);
  });

  // Customer Payments
  const [payments, setPayments] = useState<Payment[]>(() => {
    return loadStored<Payment[]>('ahmad_payments', 'eplanet_payments', INITIAL_PAYMENTS);
  });

  // Customer Ledger Entries
  const [ledgerEntries, setLedgerEntries] = useState<Record<string, LedgerEntry[]>>(() => {
    return loadStored<Record<string, LedgerEntry[]>>('ahmad_ledgers', 'eplanet_ledgers', INITIAL_LEDGER_ENTRIES);
  });

  // Inventory Movement Ledger
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => {
    return loadStored<InventoryTransaction[]>('ahmad_stock_tx', 'eplanet_stock_tx', INITIAL_STOCK_TRANSACTIONS);
  });

  // Daily Closings
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>(() => {
    return loadStored<DailyClosing[]>('ahmad_daily_closings', 'eplanet_daily_closings', INITIAL_DAILY_CLOSINGS);
  });

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    return loadStored<Expense[]>('ahmad_expenses', 'eplanet_expenses', INITIAL_EXPENSES);
  });

  // Bad Debts
  const [badDebts, setBadDebts] = useState<BadDebt[]>(() => {
    return loadStored<BadDebt[]>('ahmad_bad_debts', 'eplanet_bad_debts', INITIAL_BAD_DEBTS);
  });

  // Bad Debt Recoveries
  const [badDebtRecoveries, setBadDebtRecoveries] = useState<BadDebtRecovery[]>(() => {
    return loadStored<BadDebtRecovery[]>('ahmad_bad_debt_recoveries', 'eplanet_bad_debt_recoveries', []);
  });

  // Expiry Records
  const [expiryRecords, setExpiryRecords] = useState<ExpiryRecord[]>(() => {
    return loadStored<ExpiryRecord[]>('ahmad_expiry_records', 'eplanet_expiry_records', INITIAL_EXPIRY_RECORDS);
  });

  // Damaged Stock Records
  const [damagedStockRecords, setDamagedStockRecords] = useState<DamagedStockRecord[]>(() => {
    return loadStored<DamagedStockRecord[]>('ahmad_damaged_stock', 'eplanet_damaged_stock', INITIAL_DAMAGED_STOCK);
  });

  // Staff - strictly maintained as the single Admin user
  const [staff, setStaff] = useState<Staff[]>(() => {
    const loaded = loadStored<Staff[]>('ahmad_staff', 'eplanet_staff', INITIAL_STAFF);
    if (!Array.isArray(loaded) || loaded.length !== 1 || loaded[0]?.id !== '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ahmad_staff', JSON.stringify(INITIAL_STAFF));
      }
      return INITIAL_STAFF;
    }
    return loaded;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    return loadStored<AuditLog[]>('ahmad_audit_logs', 'eplanet_audit_logs', INITIAL_AUDIT_LOGS);
  });

  // Persistence Effects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentUser) {
      const isRemembered = localStorage.getItem('ahmad_remember_session') === 'true';
      if (isRemembered) {
        localStorage.setItem('ahmad_current_user', JSON.stringify(currentUser));
      }
    } else {
      localStorage.removeItem('ahmad_current_user');
      localStorage.removeItem('eplanet_current_user');
    }
  }, [currentUser]);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_areas', JSON.stringify(areas)); }, [areas]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_supplier_payments', JSON.stringify(supplierPayments)); }, [supplierPayments]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_purchases', JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_purchase_returns', JSON.stringify(purchaseReturns)); }, [purchaseReturns]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_sales_returns', JSON.stringify(salesReturns)); }, [salesReturns]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_ledgers', JSON.stringify(ledgerEntries)); }, [ledgerEntries]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_stock_tx', JSON.stringify(inventoryTransactions)); }, [inventoryTransactions]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_daily_closings', JSON.stringify(dailyClosings)); }, [dailyClosings]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_bad_debts', JSON.stringify(badDebts)); }, [badDebts]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_bad_debt_recoveries', JSON.stringify(badDebtRecoveries)); }, [badDebtRecoveries]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_expiry_records', JSON.stringify(expiryRecords)); }, [expiryRecords]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_damaged_stock', JSON.stringify(damagedStockRecords)); }, [damagedStockRecords]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_staff', JSON.stringify(staff)); }, [staff]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ahmad_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);

  // Supabase Synchronization State & Helpers
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');

  const syncMutation = async (entity: string, action: 'upsert' | 'delete', data?: any, id?: string) => {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/supabase/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, action, data, id }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[Supabase Sync] ${entity} mutation server response:`, errJson);
      }
    } catch (err) {
      console.warn(`[Supabase Sync] ${entity} mutation network error:`, err);
    }
  };

  const refreshFromSupabase = async () => {
    try {
      setSupabaseSyncStatus('syncing');
      const res = await fetch('/api/supabase/data');
      const json = await res.json();
      if (json.success && json.configured) {
        if (json.hasData && json.data) {
          if (Array.isArray(json.data.areas)) {
            setAreas(json.data.areas);
            try { localStorage.setItem('ahmad_areas', JSON.stringify(json.data.areas)); } catch (_) {}
          }
          if (Array.isArray(json.data.clients)) {
            setClients(json.data.clients);
            try { localStorage.setItem('ahmad_clients', JSON.stringify(json.data.clients)); } catch (_) {}
          }
          if (Array.isArray(json.data.products)) {
            setProducts(json.data.products);
            try { localStorage.setItem('ahmad_products', JSON.stringify(json.data.products)); } catch (_) {}
          }
          if (Array.isArray(json.data.suppliers)) {
            setSuppliers(json.data.suppliers);
            try { localStorage.setItem('ahmad_suppliers', JSON.stringify(json.data.suppliers)); } catch (_) {}
          }
          if (Array.isArray(json.data.supplierPayments)) {
            setSupplierPayments(json.data.supplierPayments);
            try { localStorage.setItem('ahmad_supplier_payments', JSON.stringify(json.data.supplierPayments)); } catch (_) {}
          }
          if (Array.isArray(json.data.purchases)) {
            setPurchases(json.data.purchases);
            try { localStorage.setItem('ahmad_purchases', JSON.stringify(json.data.purchases)); } catch (_) {}
          }
          if (Array.isArray(json.data.purchaseReturns)) {
            setPurchaseReturns(json.data.purchaseReturns);
            try { localStorage.setItem('ahmad_purchase_returns', JSON.stringify(json.data.purchaseReturns)); } catch (_) {}
          }
          if (Array.isArray(json.data.orders)) {
            setOrders(json.data.orders);
            try { localStorage.setItem('ahmad_orders', JSON.stringify(json.data.orders)); } catch (_) {}
          }
          if (Array.isArray(json.data.salesReturns)) {
            setSalesReturns(json.data.salesReturns);
            try { localStorage.setItem('ahmad_sales_returns', JSON.stringify(json.data.salesReturns)); } catch (_) {}
          }
          if (Array.isArray(json.data.payments)) {
            setPayments(json.data.payments);
            try { localStorage.setItem('ahmad_payments', JSON.stringify(json.data.payments)); } catch (_) {}
          }
          if (json.data.ledgerEntries && typeof json.data.ledgerEntries === 'object') {
            setLedgerEntries(json.data.ledgerEntries);
            try { localStorage.setItem('ahmad_ledgers', JSON.stringify(json.data.ledgerEntries)); } catch (_) {}
          }
          if (Array.isArray(json.data.inventoryTransactions)) {
            setInventoryTransactions(json.data.inventoryTransactions);
            try { localStorage.setItem('ahmad_stock_tx', JSON.stringify(json.data.inventoryTransactions)); } catch (_) {}
          }
          if (Array.isArray(json.data.expenses)) {
            setExpenses(json.data.expenses);
            try { localStorage.setItem('ahmad_expenses', JSON.stringify(json.data.expenses)); } catch (_) {}
          }
          if (Array.isArray(json.data.dailyClosings)) {
            setDailyClosings(json.data.dailyClosings);
            try { localStorage.setItem('ahmad_daily_closings', JSON.stringify(json.data.dailyClosings)); } catch (_) {}
          }
          if (Array.isArray(json.data.badDebts)) {
            setBadDebts(json.data.badDebts);
            try { localStorage.setItem('ahmad_bad_debts', JSON.stringify(json.data.badDebts)); } catch (_) {}
          }
          if (Array.isArray(json.data.badDebtRecoveries)) {
            setBadDebtRecoveries(json.data.badDebtRecoveries);
            try { localStorage.setItem('ahmad_bad_debt_recoveries', JSON.stringify(json.data.badDebtRecoveries)); } catch (_) {}
          }
          if (Array.isArray(json.data.damagedStockRecords)) {
            setDamagedStockRecords(json.data.damagedStockRecords);
            try { localStorage.setItem('ahmad_damaged_stock', JSON.stringify(json.data.damagedStockRecords)); } catch (_) {}
          }
          if (Array.isArray(json.data.expiryRecords)) {
            setExpiryRecords(json.data.expiryRecords);
            try { localStorage.setItem('ahmad_expiry_records', JSON.stringify(json.data.expiryRecords)); } catch (_) {}
          }
          if (Array.isArray(json.data.staff)) {
            setStaff(json.data.staff);
            try { localStorage.setItem('ahmad_staff', JSON.stringify(json.data.staff)); } catch (_) {}
          }
          if (Array.isArray(json.data.auditLogs)) {
            setAuditLogs(json.data.auditLogs);
            try { localStorage.setItem('ahmad_audit_logs', JSON.stringify(json.data.auditLogs)); } catch (_) {}
          }
        } else {
          INITIAL_AREAS.forEach(area => syncMutation('area', 'upsert', area));
        }
        setSupabaseSyncStatus('synced');
      } else {
        setSupabaseSyncStatus('offline');
      }
    } catch (err) {
      console.warn('[Supabase Sync] Load error:', err);
      setSupabaseSyncStatus('offline');
    }
  };

  useEffect(() => {
    refreshFromSupabase();
  }, []);

  // Auth operations
  const login = (emailOrUser: string | User, role?: string) => {
    let newUser: User;
    if (typeof emailOrUser === 'object' && emailOrUser !== null) {
      newUser = {
        ...emailOrUser,
        id: emailOrUser.id || '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf',
        role: 'Admin',
      };
    } else {
      const email = emailOrUser;
      const matched = staff.find(s => s.email.toLowerCase() === email.toLowerCase());
      newUser = {
        id: matched?.id || '00a1090c-43b2-41ae-83a9-7d3c2d4daaaf',
        name: matched?.name || email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: email,
        role: 'Admin',
        department: matched?.department || 'Executive Management',
        avatarUrl: matched?.avatarUrl,
      };
    }
    setCurrentUser(newUser);
    addAuditLog('User Login', 'System', newUser.name, `User ${newUser.email} signed in with role Admin`);
    return true;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('User Logout', 'System', currentUser.name, `User ${currentUser.email} logged out`);
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ahmad_current_user');
      localStorage.removeItem('eplanet_current_user');
      localStorage.removeItem('ahmad_remember_session');
    }
  };

  // Audit helper
  const addAuditLog = (action: string, module: AuditLog['module'], recordRef: string, details: string) => {
    const newLog: AuditLog = {
      id: generateUUID(),
      timestamp: formatDateDDMMYYYY(new Date()) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      user: currentUser?.name || 'System',
      action,
      module,
      recordRef,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);
    syncMutation('audit_log', 'upsert', newLog);
  };

  // Closed day helper
  const isDateClosed = (dateStr: string): boolean => {
    const closing = dailyClosings.find(c => c.date === dateStr);
    return closing?.status === 'CLOSED';
  };

  // Areas
  const addArea = (areaData: Omit<Area, 'id' | 'createdAt'>): Area => {
    const newArea: Area = {
      ...areaData,
      id: generateUUID(),
      createdAt: getTodayKarachiDate(),
    };
    setAreas(prev => [...prev, newArea]);
    syncMutation('area', 'upsert', newArea);
    addAuditLog('Created Area', 'System', newArea.name, `Added distribution area ${newArea.name} (${newArea.code})`);
    return newArea;
  };

  const updateArea = (id: string, areaData: Partial<Area>) => {
    setAreas(prev => prev.map(a => (a.id === id ? { ...a, ...areaData } : a)));
    const target = areas.find(a => a.id === id);
    if (target) syncMutation('area', 'upsert', { ...target, ...areaData });
    addAuditLog('Updated Area', 'System', id, `Updated area details`);
  };

  const toggleAreaStatus = (id: string) => {
    setAreas(prev =>
      prev.map(a => {
        if (a.id === id) {
          const nextStatus = a.status === 'Active' ? 'Inactive' : 'Active';
          syncMutation('area', 'upsert', { ...a, status: nextStatus });
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  // Client operations
  const addClient = (
    clientData: Omit<
      Client,
      'id' | 'clientId' | 'totalPurchases' | 'totalPaid' | 'currentBalance' | 'lastTransactionDate' | 'createdAt'
    >
  ): Client => {
    const count = clients.length + 1001;
    const clientId = `CLT-${count}`;
    const initialBal = clientData.openingBalance || 0;
    const newClient: Client = {
      ...clientData,
      id: generateUUID(),
      clientId,
      totalPurchases: initialBal,
      totalPaid: 0,
      currentBalance: initialBal,
      lastTransactionDate: getTodayKarachiDate(),
      createdAt: getTodayKarachiDate(),
    };

    setClients(prev => [newClient, ...prev]);

    if (initialBal > 0) {
      const ledgerEntry: LedgerEntry = {
        id: generateUUID(),
        clientId: newClient.id,
        date: getTodayKarachiDate(),
        reference: `OPB-${newClient.clientId}`,
        type: 'Opening Balance',
        description: 'Initial opening balance',
        debit: initialBal,
        credit: 0,
        balance: initialBal,
      };
      setLedgerEntries(prev => ({
        ...prev,
        [newClient.id]: [ledgerEntry],
      }));
    }

    addAuditLog('Created Client', 'Clients', clientId, `Added client ${newClient.companyName} (${newClient.name}) in ${newClient.area}`);
    syncMutation('client', 'upsert', newClient);
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...clientData } : c)));
    const target = clients.find(c => c.id === id);
    if (target) syncMutation('client', 'upsert', { ...target, ...clientData });
    addAuditLog('Updated Client', 'Clients', target?.clientId || id, `Updated information for ${target?.companyName}`);
  };

  const deleteClient = (id: string) => {
    const target = clients.find(c => c.id === id);
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      try { localStorage.setItem('ahmad_clients', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
    syncMutation('client', 'delete', undefined, id);
    addAuditLog('Deleted Client', 'Clients', target?.clientId || id, `Removed client ${target?.companyName}`);
  };

  // Product operations
  const addProduct = (productData: Omit<Product, 'id' | 'reservedStock' | 'availableStock' | 'status'>): Product => {
    const currentStock = productData.currentStock || 0;
    const minStock = productData.minStockLevel || 20;
    let status: Product['status'] = 'In Stock';
    if (currentStock === 0) status = 'Out of Stock';
    else if (currentStock <= minStock) status = 'Low Stock';

    const newProduct: Product = {
      ...productData,
      id: generateUUID(),
      reservedStock: 0,
      availableStock: currentStock,
      status,
    };
    setProducts(prev => [newProduct, ...prev]);

    // Record initial opening stock transaction if stock > 0
    if (currentStock > 0) {
      recordStockMovement(
        newProduct.id,
        'OPENING_STOCK',
        currentStock,
        `OPN-${newProduct.sku}`,
        'Initial product opening stock inventory balance'
      );
    }

    addAuditLog('Added Product', 'Inventory', newProduct.sku, `Added product ${newProduct.name} (${newProduct.category})`);
    syncMutation('product', 'upsert', newProduct);
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...productData };
        syncMutation('product', 'upsert', updated);
        const avail = updated.currentStock - updated.reservedStock;
        let status: Product['status'] = 'In Stock';
        if (updated.currentStock === 0) status = 'Out of Stock';
        else if (updated.currentStock <= updated.minStockLevel) status = 'Low Stock';
        return { ...updated, availableStock: Math.max(0, avail), status };
      })
    );
    addAuditLog('Updated Product', 'Inventory', id, `Updated product attributes`);
  };

  const deleteProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      try { localStorage.setItem('ahmad_products', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
    syncMutation('product', 'delete', undefined, id);
    addAuditLog('Deleted Product', 'Inventory', target?.sku || id, `Deleted product ${target?.name || id}`);
  };

  const adjustProductStock = (productId: string, newStock: number, reason?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const prevStock = product.currentStock;
    const targetStock = Math.max(0, Number(newStock));
    const delta = targetStock - prevStock;
    if (delta === 0) return;

    setProducts(prev =>
      prev.map(p => {
        if (p.id !== productId) return p;
        const avail = Math.max(0, targetStock - p.reservedStock);
        let status: Product['status'] = 'In Stock';
        if (targetStock === 0) status = 'Out of Stock';
        else if (targetStock <= p.minStockLevel) status = 'Low Stock';
        return {
          ...p,
          currentStock: targetStock,
          availableStock: avail,
          status,
        };
      })
    );

    const tx: InventoryTransaction = {
      id: generateUUID(),
      date: getTodayKarachiDate(),
      reference: `ADJ-${Date.now().toString().slice(-4)}`,
      productId,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      batch: product.batchNumber,
      type: 'STOCK_ADJUSTMENT',
      quantity: delta,
      unit: product.unit,
      previousStock: prevStock,
      newStock: targetStock,
      unitCost: product.costPrice,
      totalCost: Math.abs(delta) * product.costPrice,
      user: currentUser?.name || 'Inventory Manager',
      notes: reason || `Stock adjusted from ${prevStock} to ${targetStock} ${product.unit}`,
      warehouse: 'Khuram Chowk Warehouse',
    };
    setInventoryTransactions(prev => [tx, ...prev]);
    addAuditLog('Stock Adjustment', 'Inventory', product.sku, `Adjusted stock of ${product.name} from ${prevStock} to ${targetStock} (${delta >= 0 ? '+' : ''}${delta} ${product.unit})`);
  };

  const resetAllData = () => {
    setProducts([]);
    setClients([]);
    setSuppliers([]);
    setPurchases([]);
    setPurchaseReturns([]);
    setOrders([]);
    setSalesReturns([]);
    setPayments([]);
    setSupplierPayments([]);
    setLedgerEntries({});
    setInventoryTransactions([]);
    setDailyClosings([]);
    setExpenses([]);
    setBadDebts([]);
    setBadDebtRecoveries([]);
    setExpiryRecords([]);
    setDamagedStockRecords([]);

    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      const keysToWipe = [
        'ahmad_current_user', 'eplanet_current_user',
        'ahmad_products', 'eplanet_products',
        'ahmad_clients', 'eplanet_clients',
        'ahmad_suppliers', 'eplanet_suppliers',
        'ahmad_supplier_payments', 'eplanet_supplier_payments',
        'ahmad_purchases', 'eplanet_purchases',
        'ahmad_purchase_returns', 'eplanet_purchase_returns',
        'ahmad_orders', 'eplanet_orders',
        'ahmad_sales_returns', 'eplanet_sales_returns',
        'ahmad_payments', 'eplanet_payments',
        'ahmad_ledgers', 'eplanet_ledgers',
        'ahmad_stock_tx', 'eplanet_stock_tx',
        'ahmad_daily_closings', 'eplanet_daily_closings',
        'ahmad_expenses', 'eplanet_expenses',
        'ahmad_bad_debts', 'eplanet_bad_debts',
        'ahmad_bad_debt_recoveries', 'eplanet_bad_debt_recoveries',
        'ahmad_expiry_records', 'eplanet_expiry_records',
        'ahmad_damaged_stock', 'eplanet_damaged_stock',
      ];
      keysToWipe.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('ahmad_wiped_to_zero_v5', 'true');
    }

    addAuditLog('Portal Data Reset', 'System', 'RESET', 'All portal data wiped to 0. Fresh start initialized.');
  };

  // Suppliers & Supplier Payments
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'supplierId' | 'currentPayable' | 'createdAt'>): Supplier => {
    const supplierId = `SUP-${suppliers.length + 101}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id: generateUUID(),
      supplierId,
      currentPayable: supplierData.openingPayable || 0,
      createdAt: getTodayKarachiDate(),
    };
    setSuppliers(prev => [...prev, newSupplier]);
    addAuditLog('Added Supplier', 'Purchases', supplierId, `Added supplier ${newSupplier.name}`);
    syncMutation('supplier', 'upsert', newSupplier);
    return newSupplier;
  };

  const updateSupplier = (id: string, supplierData: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...supplierData } : s)));
    const target = suppliers.find(s => s.id === id);
    if (target) syncMutation('supplier', 'upsert', { ...target, ...supplierData });
    addAuditLog('Updated Supplier', 'Purchases', id, `Updated supplier attributes`);
  };

  const deleteSupplier = (id: string) => {
    const target = suppliers.find(s => s.id === id);
    setSuppliers(prev => {
      const updated = prev.filter(s => s.id !== id);
      try { localStorage.setItem('ahmad_suppliers', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
    syncMutation('supplier', 'delete', undefined, id);
    addAuditLog('Deleted Supplier', 'Purchases', target?.supplierId || id, `Deleted supplier ${target?.name || id}`);
  };

  const recordSupplierPayment = (paymentData: Omit<SupplierPayment, 'id' | 'paymentNumber'>): SupplierPayment => {
    const paymentNumber = `SPAY-${Date.now().toString().slice(-4)}`;
    const newPayment: SupplierPayment = {
      ...paymentData,
      id: generateUUID(),
      paymentNumber,
    };
    setSupplierPayments(prev => [newPayment, ...prev]);

    // Reduce supplier payable balance (Does NOT affect operational expense or sales)
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === paymentData.supplierId) {
          return {
            ...s,
            currentPayable: Math.max(0, s.currentPayable - paymentData.amount),
          };
        }
        return s;
      })
    );

    addAuditLog('Supplier Payment', 'Finance', paymentNumber, `Paid Rs. ${paymentData.amount.toLocaleString()} to ${paymentData.supplierName}`);
    syncMutation('supplier_payment', 'upsert', newPayment);
    return newPayment;
  };

  // Purchases
  const createPurchase = (purchaseData: Omit<Purchase, 'id' | 'invoiceNumber' | 'createdAt'>): Purchase => {
    const invoiceNumber = `PINV-${Math.floor(5000 + Math.random() * 1000)}`;
    const newPurchase: Purchase = {
      ...purchaseData,
      id: generateUUID(),
      items: purchaseData.items.map(it => ({ ...it, id: generateUUID() })),
      invoiceNumber,
      createdAt: getTodayKarachiDate(),
    };

    setPurchases(prev => [newPurchase, ...prev]);

    // If purchase is created with 'Posted' status, immediately apply stock & supplier payable
    if (newPurchase.status === 'Posted') {
      applyPostedPurchase(newPurchase);
    }

    addAuditLog('Created Purchase', 'Purchases', invoiceNumber, `Created purchase invoice #${invoiceNumber} from ${newPurchase.supplierName} (Status: ${newPurchase.status})`);
    syncMutation('purchase', 'upsert', newPurchase);
    return newPurchase;
  };

  const applyPostedPurchase = (purchase: Purchase) => {
    // 1. Increase stock for each purchase line
    purchase.items.forEach(item => {
      recordStockMovement(
        item.productId,
        'PURCHASE',
        item.quantity,
        purchase.invoiceNumber,
        `Purchase from ${purchase.supplierName} (Batch: ${item.batchNumber})`,
        purchase.supplierName,
        'Khuram Chowk Warehouse',
        item.unit
      );

      // Track expiry record if expiryDate provided
      if (item.expiryDate) {
        const existingExp = expiryRecords.find(e => e.productId === item.productId && e.batch === item.batchNumber);
        if (existingExp) {
          setExpiryRecords(prev =>
            prev.map(e =>
              e.id === existingExp.id ? { ...e, quantity: e.quantity + item.quantity } : e
            )
          );
        } else {
          const newExp: ExpiryRecord = {
            id: 'exp-' + Date.now() + Math.random(),
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            batch: item.batchNumber,
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            unit: item.unit,
            purchaseCost: item.purchasePrice,
            status: 'Safe',
          };
          setExpiryRecords(prev => [...prev, newExp]);
        }
      }
    });

    // 2. Increase supplier payable by remaining unpaid balance
    if (purchase.remainingPayable > 0) {
      setSuppliers(prev =>
        prev.map(s => {
          if (s.id === purchase.supplierId) {
            return {
              ...s,
              currentPayable: s.currentPayable + purchase.remainingPayable,
            };
          }
          return s;
        })
      );
    }
  };

  const postPurchase = (purchaseId: string): boolean => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return false;
    if (purchase.status === 'Posted') return true; // Already posted, prevent duplicate

    if (isDateClosed(purchase.purchaseDate)) {
      throw new Error(`Cannot post purchase: Business day ${formatDateDDMMYYYY(purchase.purchaseDate)} is closed.`);
    }

    setPurchases(prev => prev.map(p => (p.id === purchaseId ? { ...p, status: 'Posted' } : p)));
    applyPostedPurchase({ ...purchase, status: 'Posted' });
    addAuditLog('Posted Purchase', 'Purchases', purchase.invoiceNumber, `Posted purchase #${purchase.invoiceNumber} into inventory`);
    return true;
  };

  const recordPurchaseReturn = (returnData: Omit<PurchaseReturn, 'id' | 'returnNumber' | 'status'>): PurchaseReturn => {
    const returnNumber = `PRTN-${Math.floor(1000 + Math.random() * 1000)}`;
    const newReturn: PurchaseReturn = {
      ...returnData,
      id: generateUUID(),
      returnNumber,
      status: 'Completed',
    };

    setPurchaseReturns(prev => [newReturn, ...prev]);

    // 1. Deduct inventory
    recordStockMovement(
      newReturn.productId,
      'PURCHASE_RETURN',
      -newReturn.quantity,
      returnNumber,
      `Purchase return to ${newReturn.supplierName}: ${newReturn.reason}`,
      newReturn.supplierName,
      'Khuram Chowk Warehouse',
      newReturn.unit
    );

    // 2. Reduce supplier payable
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === newReturn.supplierId) {
          return {
            ...s,
            currentPayable: Math.max(0, s.currentPayable - newReturn.refundAmount),
          };
        }
        return s;
      })
    );

    // 3. Mark the original purchase as Returned so it is removed from active Daily Purchases!
    const targetPurchase = purchases.find(p => p.id === newReturn.purchaseId || p.invoiceNumber === newReturn.purchaseInvoiceNumber);
    if (targetPurchase) {
      const updatedPurchase: Purchase = { ...targetPurchase, status: 'Returned' };
      setPurchases(prev => {
        const next = prev.map(p => (p.id === targetPurchase.id ? updatedPurchase : p));
        try { localStorage.setItem('ahmad_purchases', JSON.stringify(next)); } catch (_) {}
        return next;
      });
      syncMutation('purchase', 'upsert', updatedPurchase);
    }

    addAuditLog('Purchase Return', 'Purchases', returnNumber, `Returned ${newReturn.quantity} units to ${newReturn.supplierName} (Refund: Rs. ${newReturn.refundAmount.toLocaleString()}) - Marked purchase as Returned`);
    syncMutation('purchase_return', 'upsert', newReturn);
    return newReturn;
  };

  const returnPurchase = (purchaseId: string, options?: { reason?: string }): PurchaseReturn => {
    const purchase = purchases.find(p => p.id === purchaseId || p.invoiceNumber === purchaseId);
    if (!purchase) {
      throw new Error(`Purchase #${purchaseId} not found.`);
    }

    const returnNumber = `PRTN-${Math.floor(1000 + Math.random() * 1000)}`;
    const reason = options?.reason || 'Consignment returned to supplier';
    const returnDate = getTodayKarachiDate();

    // 1. Deduct stock for each item in the purchase
    purchase.items.forEach(item => {
      recordStockMovement(
        item.productId,
        'PURCHASE_RETURN',
        -item.quantity,
        returnNumber,
        `Full Purchase Return for #${purchase.invoiceNumber}: ${item.productName}`,
        purchase.supplierName,
        'Khuram Chowk Warehouse',
        item.unit
      );
    });

    // 2. Reduce supplier payable
    const payableToReduce = purchase.remainingPayable > 0 ? purchase.remainingPayable : purchase.grandTotal;
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === purchase.supplierId) {
          return {
            ...s,
            currentPayable: Math.max(0, s.currentPayable - payableToReduce),
          };
        }
        return s;
      })
    );

    // 3. Create master PurchaseReturn record
    const firstItem = purchase.items[0];
    const totalQty = purchase.items.reduce((sum, it) => sum + it.quantity, 0);
    const newReturn: PurchaseReturn = {
      id: generateUUID(),
      returnNumber,
      purchaseId: purchase.id,
      purchaseInvoiceNumber: purchase.invoiceNumber,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      productId: firstItem?.productId || products[0]?.id || '',
      productName: purchase.items.length > 1 ? `${firstItem?.productName} + ${purchase.items.length - 1} other item(s)` : (firstItem?.productName || 'Returned Goods'),
      quantity: totalQty,
      unit: firstItem?.unit || 'Carton',
      batch: firstItem?.batchNumber || 'RETURN',
      returnDate,
      refundAmount: purchase.grandTotal,
      reason,
      status: 'Completed',
    };

    setPurchaseReturns(prev => {
      const next = [newReturn, ...prev];
      try { localStorage.setItem('ahmad_purchase_returns', JSON.stringify(next)); } catch (_) {}
      return next;
    });

    // 4. Update the purchase status to 'Returned' and sync
    const updatedPurchase: Purchase = { ...purchase, status: 'Returned' };
    setPurchases(prev => {
      const next = prev.map(p => (p.id === purchase.id ? updatedPurchase : p));
      try { localStorage.setItem('ahmad_purchases', JSON.stringify(next)); } catch (_) {}
      return next;
    });

    addAuditLog('Purchase Return', 'Purchases', returnNumber, `Returned purchase #${purchase.invoiceNumber} to ${purchase.supplierName} (Refund: Rs. ${purchase.grandTotal.toLocaleString()}). Removed from Daily Purchases.`);
    syncMutation('purchase_return', 'upsert', newReturn);
    syncMutation('purchase', 'upsert', updatedPurchase);

    return newReturn;
  };

  // Sales Orders (Party-wise daily sales)
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): { success: boolean; order?: Order; error?: string } => {
    // 1. Check if the business day is closed
    if (isDateClosed(orderData.orderDate)) {
      return {
        success: false,
        error: `Business day ${formatDateDDMMYYYY(orderData.orderDate)} is CLOSED. Reopen day first to record sales.`,
      };
    }

    // 2. Check stock availability for every line
    for (const item of orderData.items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Product ${item.productName} not found.` };
      }
      if (prod.currentStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}". Available: ${prod.currentStock}, Requested: ${item.quantity}.`,
        };
      }
    }

    const orderNumber = `INV-${Math.floor(8800 + Math.random() * 1000)}`;
    const newOrder: Order = {
      ...orderData,
      id: generateUUID(),
      items: orderData.items.map(it => ({ ...it, id: generateUUID() })),
      orderNumber,
      status: 'Posted',
      createdAt: getTodayKarachiDate(),
    };

    setOrders(prev => [newOrder, ...prev]);

    // 3. Deduct stock for all ordered products
    newOrder.items.forEach(item => {
      recordStockMovement(
        item.productId,
        'SALE',
        -item.quantity,
        orderNumber,
        `Sale to ${newOrder.companyName} (${newOrder.area})`,
        undefined,
        'Khuram Chowk Warehouse',
        item.unit
      );
    });

    // 4. Update Client Ledger and Receivables
    // Credit amount = grandTotal - amountPaid
    const creditCreated = newOrder.grandTotal - newOrder.amountPaid;
    const client = clients.find(c => c.id === newOrder.clientId);

    if (client) {
      const existingLedger = ledgerEntries[newOrder.clientId] || [];
      const lastBal = existingLedger.length > 0 ? existingLedger[existingLedger.length - 1].balance : client.currentBalance;
      const newBal = lastBal + creditCreated;

      const ledgerEntry: LedgerEntry = {
        id: 'led-' + Date.now() + Math.random(),
        clientId: newOrder.clientId,
        date: newOrder.orderDate,
        reference: orderNumber,
        type: newOrder.amountPaid > 0 && creditCreated > 0 ? 'Invoice' : creditCreated > 0 ? 'Credit Sale' : 'Cash Sale',
        description: `Sale #${orderNumber} (${newOrder.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')})`,
        debit: newOrder.grandTotal,
        credit: newOrder.amountPaid, // Direct cash credit against this invoice
        balance: newBal,
      };

      setLedgerEntries(prev => ({
        ...prev,
        [newOrder.clientId]: [...(prev[newOrder.clientId] || []), ledgerEntry],
      }));

      // Update client balance & purchases
      setClients(prev =>
        prev.map(c => {
          if (c.id === newOrder.clientId) {
            return {
              ...c,
              totalPurchases: c.totalPurchases + newOrder.grandTotal,
              currentBalance: c.currentBalance + creditCreated,
              totalPaid: c.totalPaid + newOrder.amountPaid,
              lastTransactionDate: newOrder.orderDate,
            };
          }
          return c;
        })
      );
    }

    addAuditLog('Created Sale', 'Sales', orderNumber, `Sale #${orderNumber} for ${newOrder.companyName} - Total: Rs. ${newOrder.grandTotal.toLocaleString()}, Cash: Rs. ${newOrder.amountPaid.toLocaleString()}, Credit: Rs. ${creditCreated.toLocaleString()}`);
    syncMutation('order', 'upsert', newOrder);
    return { success: true, order: newOrder };
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        syncMutation('order', 'upsert', { ...o, status });
        return { ...o, status };
      }
      return o;
    }));
    addAuditLog('Updated Order Status', 'Sales', orderId, `Changed order status to ${status}`);
  };

  // Sales Returns
  const recordSalesReturn = (returnData: Omit<SalesReturn, 'id' | 'returnNumber' | 'status'>): SalesReturn => {
    const returnNumber = `SRTN-${Math.floor(1000 + Math.random() * 1000)}`;
    const newReturn: SalesReturn = {
      ...returnData,
      id: generateUUID(),
      returnNumber,
      status: 'Completed',
    };

    setSalesReturns(prev => [newReturn, ...prev]);

    // 1. If resalable, add back to saleable stock. If damaged, record as damaged stock!
    if (newReturn.isResalable) {
      recordStockMovement(
        newReturn.productId,
        'SALES_RETURN',
        newReturn.quantity,
        returnNumber,
        `Sales Return from ${newReturn.clientName}: Resalable stock`,
        undefined,
        'Khuram Chowk Warehouse',
        newReturn.unit
      );
    } else {
      // Unsaleable / damaged return
      const prod = products.find(p => p.id === newReturn.productId);
      const cost = prod?.costPrice || 0;
      const damagedRecord: DamagedStockRecord = {
        id: generateUUID(),
        productId: newReturn.productId,
        productName: newReturn.productName,
        category: prod?.category || 'Cold Drinks',
        batch: newReturn.batch || 'RETURN-DAMAGED',
        quantity: newReturn.quantity,
        unit: newReturn.unit,
        unitCost: cost,
        totalLoss: newReturn.quantity * cost,
        date: newReturn.returnDate,
        reason: `Customer return damaged: ${newReturn.reason}`,
        recordedBy: currentUser?.name || 'Sales Staff',
      };
      setDamagedStockRecords(prev => [...prev, damagedRecord]);
    }

    // 2. Adjust customer ledger & receivable
    const client = clients.find(c => c.id === newReturn.clientId);
    if (client) {
      const existingLedger = ledgerEntries[newReturn.clientId] || [];
      const lastBal = existingLedger.length > 0 ? existingLedger[existingLedger.length - 1].balance : client.currentBalance;
      const newBal = Math.max(0, lastBal - newReturn.refundAmount);

      const ledgerEntry: LedgerEntry = {
        id: 'led-' + Date.now(),
        clientId: newReturn.clientId,
        date: newReturn.returnDate,
        reference: returnNumber,
        type: 'Sales Return',
        description: `Sales return for ${newReturn.orderNumber}: ${newReturn.quantity} units ${newReturn.productName}`,
        debit: 0,
        credit: newReturn.refundAmount,
        balance: newBal,
        notes: newReturn.reason,
      };

      setLedgerEntries(prev => ({
        ...prev,
        [newReturn.clientId]: [...(prev[newReturn.clientId] || []), ledgerEntry],
      }));

      setClients(prev =>
        prev.map(c => {
          if (c.id === newReturn.clientId) {
            return {
              ...c,
              totalPurchases: Math.max(0, c.totalPurchases - newReturn.refundAmount),
              currentBalance: Math.max(0, c.currentBalance - newReturn.refundAmount),
              lastTransactionDate: newReturn.returnDate,
            };
          }
          return c;
        })
      );
    }

    // 3. Mark the original order as Returned so it is automatically removed from active Daily Sales!
    const targetOrder = orders.find(o => o.id === newReturn.orderId || o.orderNumber === newReturn.orderNumber);
    if (targetOrder) {
      const updatedOrder: Order = { ...targetOrder, status: 'Returned' };
      setOrders(prev => {
        const next = prev.map(o => (o.id === targetOrder.id ? updatedOrder : o));
        try { localStorage.setItem('ahmad_orders', JSON.stringify(next)); } catch (_) {}
        return next;
      });
      syncMutation('order', 'upsert', updatedOrder);
    }

    addAuditLog('Sales Return', 'Sales', returnNumber, `Recorded sales return of ${newReturn.quantity} units from ${newReturn.clientName} (Refund credit: Rs. ${newReturn.refundAmount.toLocaleString()}) - Marked order as Returned`);
    syncMutation('sales_return', 'upsert', newReturn);
    return newReturn;
  };

  const returnSale = (orderId: string, options?: { reason?: string; isResalable?: boolean; refundAmount?: number }): SalesReturn => {
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const returnNumber = `SRTN-${Math.floor(1000 + Math.random() * 1000)}`;
    const reason = options?.reason || 'Customer sales invoice returned';
    const isResalable = options?.isResalable !== undefined ? options.isResalable : true;
    const returnDate = getTodayKarachiDate();
    const refundAmount = options?.refundAmount !== undefined ? options.refundAmount : order.grandTotal;

    // 1. Restock each item from the order
    order.items.forEach(item => {
      if (isResalable) {
        recordStockMovement(
          item.productId,
          'SALES_RETURN',
          item.quantity,
          returnNumber,
          `Sales Return for #${order.orderNumber}: ${item.productName}`,
          undefined,
          'Khuram Chowk Warehouse',
          item.unit
        );
      } else {
        const prod = products.find(p => p.id === item.productId);
        const cost = prod?.costPrice || 0;
        const damagedRecord: DamagedStockRecord = {
          id: generateUUID(),
          productId: item.productId,
          productName: item.productName,
          category: prod?.category || 'Cold Drinks',
          batch: item.batch || 'RETURN-DAMAGED',
          quantity: item.quantity,
          unit: item.unit,
          unitCost: cost,
          totalLoss: item.quantity * cost,
          date: returnDate,
          reason: `Returned damaged from #${order.orderNumber}: ${reason}`,
          recordedBy: currentUser?.name || 'Sales Staff',
        };
        setDamagedStockRecords(prev => [...prev, damagedRecord]);
      }
    });

    // 2. Adjust customer ledger & balance
    const client = clients.find(c => c.id === order.clientId);
    if (client) {
      const existingLedger = ledgerEntries[order.clientId] || [];
      const lastBal = existingLedger.length > 0 ? existingLedger[existingLedger.length - 1].balance : client.currentBalance;
      const creditToReverse = order.amountRemaining > 0 ? order.amountRemaining : 0;
      const newBal = Math.max(0, lastBal - (creditToReverse > 0 ? creditToReverse : refundAmount));

      const ledgerEntry: LedgerEntry = {
        id: 'led-' + Date.now(),
        clientId: order.clientId,
        date: returnDate,
        reference: returnNumber,
        type: 'Sales Return',
        description: `Full sales return for Invoice #${order.orderNumber} (${order.items.length} items)`,
        debit: 0,
        credit: creditToReverse > 0 ? creditToReverse : refundAmount,
        balance: newBal,
        notes: reason,
      };

      setLedgerEntries(prev => ({
        ...prev,
        [order.clientId]: [...(prev[order.clientId] || []), ledgerEntry],
      }));

      setClients(prev =>
        prev.map(c => {
          if (c.id === order.clientId) {
            return {
              ...c,
              totalPurchases: Math.max(0, c.totalPurchases - order.grandTotal),
              currentBalance: Math.max(0, c.currentBalance - (creditToReverse > 0 ? creditToReverse : refundAmount)),
              lastTransactionDate: returnDate,
            };
          }
          return c;
        })
      );
    }

    // 3. Create master SalesReturn record
    const firstItem = order.items[0];
    const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
    const newReturn: SalesReturn = {
      id: generateUUID(),
      returnNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientId: order.clientId,
      clientName: order.companyName,
      productId: firstItem?.productId || products[0]?.id || '',
      productName: order.items.length > 1 ? `${firstItem?.productName} + ${order.items.length - 1} other item(s)` : (firstItem?.productName || 'Returned Goods'),
      quantity: totalQty,
      unit: firstItem?.unit || 'Carton',
      batch: firstItem?.batch || 'RETURN',
      returnDate,
      refundAmount,
      isResalable,
      reason,
      status: 'Completed',
    };

    setSalesReturns(prev => {
      const next = [newReturn, ...prev];
      try { localStorage.setItem('ahmad_sales_returns', JSON.stringify(next)); } catch (_) {}
      return next;
    });

    // 4. Update the order status to 'Returned' and sync
    const updatedOrder: Order = { ...order, status: 'Returned' };
    setOrders(prev => {
      const next = prev.map(o => (o.id === order.id ? updatedOrder : o));
      try { localStorage.setItem('ahmad_orders', JSON.stringify(next)); } catch (_) {}
      return next;
    });

    addAuditLog('Sales Return', 'Sales', returnNumber, `Returned sale #${order.orderNumber} for ${order.companyName} (Refund: Rs. ${refundAmount.toLocaleString()}). Removed from Daily Sales.`);
    syncMutation('sales_return', 'upsert', newReturn);
    syncMutation('order', 'upsert', updatedOrder);

    return newReturn;
  };

  // Customer Collections (Reduces receivable, NEVER counted as a new sale)
  const recordPayment = (paymentData: Omit<Payment, 'id' | 'paymentNumber' | 'status'>): { success: boolean; payment?: Payment; error?: string } => {
    if (isDateClosed(paymentData.paymentDate)) {
      return {
        success: false,
        error: `Business day ${formatDateDDMMYYYY(paymentData.paymentDate)} is CLOSED. Cannot record collections.`,
      };
    }

    const paymentNumber = `RCT-${Math.floor(2000 + Math.random() * 1000)}`;
    const newPayment: Payment = {
      ...paymentData,
      id: generateUUID(),
      paymentNumber,
      status: 'Completed',
    };

    setPayments(prev => [newPayment, ...prev]);

    // Update Client balance and Ledger
    const client = clients.find(c => c.id === paymentData.clientId);
    if (client) {
      const existingLedger = ledgerEntries[paymentData.clientId] || [];
      const lastBal = existingLedger.length > 0 ? existingLedger[existingLedger.length - 1].balance : client.currentBalance;
      const newBal = lastBal - paymentData.amount;

      const ledgerEntry: LedgerEntry = {
        id: 'led-' + Date.now(),
        clientId: paymentData.clientId,
        date: paymentData.paymentDate,
        reference: paymentNumber,
        type: 'Payment Received',
        description: `Collection received via ${paymentData.paymentMethod} (Ref: ${paymentData.referenceNumber || 'N/A'}${paymentData.allocatedInvoice ? `, Alloc: ${paymentData.allocatedInvoice}` : ''})`,
        debit: 0,
        credit: paymentData.amount,
        balance: newBal,
        notes: paymentData.notes,
      };

      setLedgerEntries(prev => ({
        ...prev,
        [paymentData.clientId]: [...(prev[paymentData.clientId] || []), ledgerEntry],
      }));

      setClients(prev =>
        prev.map(c => {
          if (c.id === paymentData.clientId) {
            return {
              ...c,
              totalPaid: c.totalPaid + paymentData.amount,
              currentBalance: c.currentBalance - paymentData.amount,
              lastTransactionDate: paymentData.paymentDate,
            };
          }
          return c;
        })
      );
    }

    addAuditLog('Recorded Collection', 'Accounts', paymentNumber, `Collection of Rs. ${paymentData.amount.toLocaleString()} from ${client?.companyName || 'Customer'} via ${paymentData.paymentMethod}`);
    syncMutation('payment', 'upsert', newPayment);
    return { success: true, payment: newPayment };
  };

  const getLedgerForClient = (clientId: string): LedgerEntry[] => {
    return ledgerEntries[clientId] || [];
  };

  // Centralized Inventory Stock Movement
  const recordStockMovement = (
    productId: string,
    type: StockMovementType,
    quantity: number,
    reference: string,
    notes?: string,
    supplier?: string,
    warehouse?: string,
    unit?: string
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const prevStock = product.currentStock;
    const newStock = Math.max(0, prevStock + quantity);

    // Update product stock
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== productId) return p;
        const avail = newStock - p.reservedStock;
        let status: Product['status'] = 'In Stock';
        if (newStock === 0) status = 'Out of Stock';
        else if (newStock <= p.minStockLevel) status = 'Low Stock';

        return {
          ...p,
          currentStock: newStock,
          availableStock: Math.max(0, avail),
          status,
        };
      })
    );

    // Record stock transaction history
    const tx: InventoryTransaction = {
      id: generateUUID(),
      date: getTodayKarachiDate(),
      reference,
      productId,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      batch: product.batchNumber,
      type,
      quantity,
      unit: unit || product.unit,
      previousStock: prevStock,
      newStock,
      unitCost: product.costPrice,
      totalCost: Math.abs(quantity) * product.costPrice,
      user: currentUser?.name || 'Inventory Manager',
      notes,
      supplier: supplier || product.supplier,
      warehouse: warehouse || 'Khuram Chowk Warehouse',
    };

    setInventoryTransactions(prev => [tx, ...prev]);
    syncMutation('inventory_tx', 'upsert', tx);
    addAuditLog('Stock Movement', 'Inventory', reference, `${type} of ${Math.abs(quantity)} units for ${product.name}`);
  };

  // Daily Closing Stock & Reconciliation
  const getDailyClosingForDate = (dateStr: string): DailyClosing => {
    const existing = dailyClosings.find(c => c.date === dateStr);
    if (existing) return existing;

    // Calculate dynamic closing stock line items for this date
    const items: DailyClosingItem[] = products.map(prod => {
      // Find transactions on this date for this product
      const txs = inventoryTransactions.filter(t => t.productId === prod.id && t.date === dateStr);
      let purchases = 0;
      let sales = 0;
      let salesReturns = 0;
      let purchaseReturns = 0;
      let expired = 0;
      let damaged = 0;
      let otherIncreases = 0;
      let otherDecreases = 0;

      txs.forEach(t => {
        if (t.type === 'PURCHASE' || (t.type === 'Stock In' && t.quantity > 0)) purchases += Math.abs(t.quantity);
        else if (t.type === 'SALE' || (t.type === 'Stock Out' && t.quantity < 0)) sales += Math.abs(t.quantity);
        else if (t.type === 'SALES_RETURN') salesReturns += Math.abs(t.quantity);
        else if (t.type === 'PURCHASE_RETURN') purchaseReturns += Math.abs(t.quantity);
        else if (t.type === 'EXPIRY_WRITE_OFF') expired += Math.abs(t.quantity);
        else if (t.type === 'DAMAGE_WRITE_OFF') damaged += Math.abs(t.quantity);
        else if (t.quantity > 0) otherIncreases += t.quantity;
        else if (t.quantity < 0) otherDecreases += Math.abs(t.quantity);
      });

      const openingStock = prod.openingStock || Math.max(0, prod.currentStock - purchases + sales);
      const expectedClosing =
        openingStock + purchases + salesReturns + otherIncreases - sales - purchaseReturns - expired - damaged - otherDecreases;

      return {
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        unit: prod.unit,
        openingStock,
        purchases,
        salesReturns,
        otherIncreases,
        sales,
        purchaseReturns,
        expired,
        damaged,
        otherDecreases,
        expectedClosing,
        physicalCount: expectedClosing,
        variance: 0,
        reason: '',
      };
    });

    const newClosing: DailyClosing = {
      id: 'cls-' + Date.now(),
      date: dateStr,
      status: 'OPEN',
      items,
    };
    return newClosing;
  };

  const saveDailyClosingCount = (dateStr: string, updatedItems: DailyClosingItem[]) => {
    setDailyClosings(prev => {
      const idx = prev.findIndex(c => c.date === dateStr);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], items: updatedItems, status: 'RECONCILIATION' };
        return updated;
      }
      return [...prev, { id: 'cls-' + Date.now(), date: dateStr, status: 'RECONCILIATION', items: updatedItems }];
    });
    addAuditLog('Reconciliation Count', 'Closing', dateStr, `Updated physical stock counts for ${formatDateDDMMYYYY(dateStr)}`);
  };

  const closeBusinessDay = (dateStr: string, closedBy: string): boolean => {
    setDailyClosings(prev => {
      const idx = prev.findIndex(c => c.date === dateStr);
      const closingRecord = idx >= 0 ? prev[idx] : getDailyClosingForDate(dateStr);
      const updatedRecord: DailyClosing = {
        ...closingRecord,
        status: 'CLOSED',
        closedAt: new Date().toISOString(),
        closedBy,
      };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedRecord;
        return copy;
      }
      return [...prev, updatedRecord];
    });

    addAuditLog('Closed Business Day', 'Closing', dateStr, `Business day ${formatDateDDMMYYYY(dateStr)} officially CLOSED by ${closedBy}. Transactions locked.`);
    return true;
  };

  const reopenBusinessDay = (dateStr: string, reopenedBy: string, reason: string): boolean => {
    setDailyClosings(prev =>
      prev.map(c => {
        if (c.date === dateStr) {
          return {
            ...c,
            status: 'OPEN',
            reopenedAt: new Date().toISOString(),
            reopenedBy,
            reopenReason: reason,
          };
        }
        return c;
      })
    );

    addAuditLog('Reopened Business Day', 'Closing', dateStr, `Business day ${formatDateDDMMYYYY(dateStr)} REOPENED by ${reopenedBy}. Reason: ${reason}`);
    return true;
  };

  // Distribution Expenses
  const addExpense = (expenseData: Omit<Expense, 'id' | 'expenseNumber'>): Expense => {
    const expenseNumber = `EXP-${Math.floor(100 + Math.random() * 900)}`;
    const newExpense: Expense = {
      ...expenseData,
      id: generateUUID(),
      expenseNumber,
      status: 'Posted',
    };
    setExpenses(prev => [newExpense, ...prev]);
    addAuditLog('Created Expense', 'Expenses', expenseNumber, `Recorded ${newExpense.category} expense of Rs. ${newExpense.amount.toLocaleString()} (${newExpense.description})`);
    syncMutation('expense', 'upsert', newExpense);
    return newExpense;
  };

  // Bad Debts & Recoveries
  const requestBadDebt = (badDebtData: Omit<BadDebt, 'id' | 'badDebtNumber' | 'status'>): BadDebt => {
    const badDebtNumber = `BDT-${Math.floor(100 + Math.random() * 900)}`;
    const newBadDebt: BadDebt = {
      ...badDebtData,
      id: generateUUID(),
      badDebtNumber,
      status: 'Pending',
    };
    setBadDebts(prev => [newBadDebt, ...prev]);
    addAuditLog('Requested Bad Debt', 'Finance', badDebtNumber, `Requested bad debt write-off of Rs. ${newBadDebt.writeOffAmount.toLocaleString()} for ${newBadDebt.clientName}`);
    syncMutation('bad_debt', 'upsert', newBadDebt);
    return newBadDebt;
  };

  const approveBadDebt = (id: string, approvedBy: string) => {
    const target = badDebts.find(b => b.id === id);
    if (!target || target.status === 'Approved') return;

    setBadDebts(prev =>
      prev.map(b =>
        b.id === id
          ? { ...b, status: 'Approved', approvedBy, approvalDate: new Date().toISOString() }
          : b
      )
    );

    // Reduce Customer Receivable balance & add ledger entry
    const client = clients.find(c => c.id === target.clientId);
    if (client) {
      const existingLedger = ledgerEntries[target.clientId] || [];
      const lastBal = existingLedger.length > 0 ? existingLedger[existingLedger.length - 1].balance : client.currentBalance;
      const newBal = Math.max(0, lastBal - target.writeOffAmount);

      const ledgerEntry: LedgerEntry = {
        id: 'led-' + Date.now(),
        clientId: target.clientId,
        date: getTodayKarachiDate(),
        reference: target.badDebtNumber,
        type: 'Bad Debt Write-off',
        description: `Approved bad debt write-off: ${target.reason} (Approved by: ${approvedBy})`,
        debit: 0,
        credit: target.writeOffAmount,
        balance: newBal,
      };

      setLedgerEntries(prev => ({
        ...prev,
        [target.clientId]: [...(prev[target.clientId] || []), ledgerEntry],
      }));

      setClients(prev =>
        prev.map(c => {
          if (c.id === target.clientId) {
            return {
              ...c,
              currentBalance: Math.max(0, c.currentBalance - target.writeOffAmount),
              lastTransactionDate: getTodayKarachiDate(),
            };
          }
          return c;
        })
      );
    }

    addAuditLog('Approved Bad Debt', 'Finance', target.badDebtNumber, `Approved bad debt write-off of Rs. ${target.writeOffAmount.toLocaleString()} for ${target.clientName}`);
  };

  const recordBadDebtRecovery = (recoveryData: Omit<BadDebtRecovery, 'id' | 'recoveryNumber'>): BadDebtRecovery => {
    const recoveryNumber = `BREC-${Math.floor(100 + Math.random() * 900)}`;
    const newRecovery: BadDebtRecovery = {
      ...recoveryData,
      id: generateUUID(),
      recoveryNumber,
    };
    setBadDebtRecoveries(prev => [newRecovery, ...prev]);

    // Ledger entry for auditable recovery
    const client = clients.find(c => c.id === recoveryData.clientId);
    if (client) {
      const ledgerEntry: LedgerEntry = {
        id: 'led-' + Date.now(),
        clientId: recoveryData.clientId,
        date: recoveryData.date,
        reference: recoveryNumber,
        type: 'Bad Debt Recovery',
        description: `Recovered previously written off bad debt via ${recoveryData.paymentMethod}`,
        debit: recoveryData.amount, // debit to acknowledge recovery
        credit: recoveryData.amount, // simultaneous credit settlement
        balance: client.currentBalance,
        notes: recoveryData.notes,
      };

      setLedgerEntries(prev => ({
        ...prev,
        [recoveryData.clientId]: [...(prev[recoveryData.clientId] || []), ledgerEntry],
      }));
    }

    addAuditLog('Bad Debt Recovery', 'Finance', recoveryNumber, `Recovered Rs. ${recoveryData.amount.toLocaleString()} from ${recoveryData.clientName}`);
    syncMutation('bad_debt_recovery', 'upsert', newRecovery);
    return newRecovery;
  };

  // Expiry & Damaged Stock Write-offs
  const writeOffExpiredStock = (recordId: string, quantity: number, reason: string) => {
    const record = expiryRecords.find(e => e.id === recordId);
    if (!record) return;

    // Deduct stock exactly once
    recordStockMovement(
      record.productId,
      'EXPIRY_WRITE_OFF',
      -quantity,
      `EXP-${record.batch}`,
      `Expired stock write-off: ${reason}`
    );

    // Update expiry record status
    setExpiryRecords(prev =>
      prev.map(e =>
        e.id === recordId
          ? {
              ...e,
              quantity: Math.max(0, e.quantity - quantity),
              status: e.quantity - quantity <= 0 ? 'Written Off' : e.status,
              writtenOffAt: new Date().toISOString(),
              reason,
            }
          : e
      )
    );

    addAuditLog('Expired Stock Write-Off', 'Inventory', record.batch, `Wrote off ${quantity} expired units of ${record.productName} (Cost Loss: Rs. ${(quantity * record.purchaseCost).toLocaleString()})`);
  };

  const recordDamagedStock = (damagedData: Omit<DamagedStockRecord, 'id' | 'totalLoss'>): DamagedStockRecord => {
    const prod = products.find(p => p.id === damagedData.productId);
    const unitCost = damagedData.unitCost || prod?.costPrice || 0;
    const totalLoss = damagedData.quantity * unitCost;

    const newDamaged: DamagedStockRecord = {
      ...damagedData,
      id: generateUUID(),
      unitCost,
      totalLoss,
    };
    setDamagedStockRecords(prev => [...prev, newDamaged]);
    syncMutation('damaged_stock', 'upsert', newDamaged);

    // Deduct stock exactly once
    recordStockMovement(
      damagedData.productId,
      'DAMAGE_WRITE_OFF',
      -damagedData.quantity,
      `DMG-${newDamaged.id.slice(-4)}`,
      `Damaged stock write-off: ${damagedData.reason}`
    );

    addAuditLog('Damaged Stock', 'Inventory', newDamaged.id, `Recorded damaged stock of ${damagedData.quantity} units for ${damagedData.productName} (Loss: Rs. ${totalLoss.toLocaleString()})`);
    return newDamaged;
  };

  // Staff
  const addStaff = (staffData: Omit<Staff, 'id' | 'employeeId'>) => {
    const empId = `EMP-${String(staff.length + 1).padStart(3, '0')}`;
    const newStaff: Staff = {
      ...staffData,
      id: generateUUID(),
      employeeId: empId,
    };
    setStaff(prev => [...prev, newStaff]);
    syncMutation('staff', 'upsert', newStaff);
    addAuditLog('Added Staff', 'Staff', empId, `Created staff account for ${newStaff.name} (${newStaff.role})`);
  };

  return (
    <AppStateContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        areas,
        addArea,
        updateArea,
        toggleAreaStatus,
        clients,
        addClient,
        updateClient,
        deleteClient,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustProductStock,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        supplierPayments,
        recordSupplierPayment,
        purchases,
        createPurchase,
        postPurchase,
        purchaseReturns,
        recordPurchaseReturn,
        returnPurchase,
        orders,
        createOrder,
        updateOrderStatus,
        salesReturns,
        recordSalesReturn,
        returnSale,
        payments,
        recordPayment,
        ledgerEntries,
        getLedgerForClient,
        inventoryTransactions,
        recordStockMovement,
        dailyClosings,
        getDailyClosingForDate,
        saveDailyClosingCount,
        closeBusinessDay,
        reopenBusinessDay,
        isDateClosed,
        expenses,
        addExpense,
        badDebts,
        requestBadDebt,
        approveBadDebt,
        badDebtRecoveries,
        recordBadDebtRecovery,
        expiryRecords,
        writeOffExpiredStock,
        damagedStockRecords,
        recordDamagedStock,
        staff,
        addStaff,
        auditLogs,
        addAuditLog,
        resetAllData,
        supabaseSyncStatus,
        refreshFromSupabase,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
