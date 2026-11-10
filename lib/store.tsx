'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  Staff,
  Client,
  Product,
  Order,
  OrderItem,
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
  ReturnSaleOptions,
  ReturnItemOption,
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
import { formatDateDDMMYYYY, getTodayKarachiDate, convertUnitQuantity, generateNextSequenceNumber } from './utils';
import { generateUUID, ensureUUID } from './supabase/service';

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
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Promise<{ success: boolean; order?: Order; error?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: 'Paid' | 'Unpaid') => void;
  salesReturns: SalesReturn[];
  recordSalesReturn: (returnData: Omit<SalesReturn, 'id' | 'returnNumber' | 'status'>) => SalesReturn;
  returnSale: (orderId: string, options?: ReturnSaleOptions) => SalesReturn;

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

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user - session authenticated state
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

  // Business state directly synced from Supabase (no localstorage caching)
  const [areas, setAreas] = useState<Area[]>(INITIAL_AREAS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>(INITIAL_PURCHASES);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<Record<string, LedgerEntry[]>>({});
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [badDebts, setBadDebts] = useState<BadDebt[]>([]);
  const [badDebtRecoveries, setBadDebtRecoveries] = useState<BadDebtRecovery[]>([]);
  const [expiryRecords, setExpiryRecords] = useState<ExpiryRecord[]>([]);
  const [damagedStockRecords, setDamagedStockRecords] = useState<DamagedStockRecord[]>([]);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Active Refs for immediate synchronous access during batched / looped mutations
  const productsRef = useRef<Product[]>(products);
  productsRef.current = products;

  const clientsRef = useRef<Client[]>(clients);
  clientsRef.current = clients;

  const suppliersRef = useRef<Supplier[]>(suppliers);
  suppliersRef.current = suppliers;

  const dailyClosingsRef = useRef<DailyClosing[]>(dailyClosings);
  dailyClosingsRef.current = dailyClosings;

  // Active purge of obsolete local storage business tables on startup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const businessKeys = [
      'ahmad_areas', 'ahmad_clients', 'ahmad_products', 'ahmad_suppliers',
      'ahmad_supplier_payments', 'ahmad_purchases', 'ahmad_purchase_returns',
      'ahmad_orders', 'ahmad_sales_returns', 'ahmad_payments', 'ahmad_ledgers',
      'ahmad_stock_tx', 'ahmad_daily_closings', 'ahmad_expenses', 'ahmad_bad_debts',
      'ahmad_bad_debt_recoveries', 'ahmad_damaged_stock', 'ahmad_expiry_records',
      'ahmad_audit_logs', 'ahmad_staff', 'ahmad_wiped_to_zero_v4', 'ahmad_wiped_to_zero_v5',
      'eplanet_areas', 'eplanet_clients', 'eplanet_products', 'eplanet_suppliers',
      'eplanet_supplier_payments', 'eplanet_purchases', 'eplanet_purchase_returns',
      'eplanet_orders', 'eplanet_sales_returns', 'eplanet_payments', 'eplanet_ledgers',
      'eplanet_stock_tx', 'eplanet_daily_closings', 'eplanet_expenses', 'eplanet_bad_debts',
      'eplanet_bad_debt_recoveries', 'eplanet_damaged_stock', 'eplanet_expiry_records',
      'eplanet_audit_logs', 'eplanet_staff'
    ];
    businessKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  }, []);

  // Session Authentication Persistence Effect (strictly for login credentials)
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

  // Supabase Synchronization State & Helpers
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');

  const syncMutation = async (entity: string, action: 'upsert' | 'delete', data?: any, id?: string): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === 'undefined') return { success: false, error: 'SSR' };
    try {
      const res = await fetch('/api/supabase/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, action, data, id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        console.warn(`[Supabase Sync] ${entity} mutation server response:`, json);
        return { success: false, error: json.message || `Failed to sync ${entity} (${res.status})` };
      }
      return { success: true };
    } catch (err: any) {
      console.warn(`[Supabase Sync] ${entity} mutation network error:`, err);
      return { success: false, error: err?.message || 'Network error syncing with database' };
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
          }
          if (Array.isArray(json.data.clients) && json.data.clients.length > 0) {
            setClients(json.data.clients);
            clientsRef.current = json.data.clients;
          }
          if (Array.isArray(json.data.products) && json.data.products.length > 0) {
            setProducts(json.data.products);
            productsRef.current = json.data.products;
          }
          if (Array.isArray(json.data.suppliers) && json.data.suppliers.length > 0) {
            setSuppliers(json.data.suppliers);
            suppliersRef.current = json.data.suppliers;
          }
          if (Array.isArray(json.data.supplierPayments)) {
            setSupplierPayments(json.data.supplierPayments);
          }
          if (Array.isArray(json.data.purchases)) {
            setPurchases(json.data.purchases);
          }
          if (Array.isArray(json.data.purchaseReturns)) {
            setPurchaseReturns(json.data.purchaseReturns);
          }
          if (Array.isArray(json.data.orders)) {
            setOrders(json.data.orders);
          }
          if (Array.isArray(json.data.salesReturns)) {
            setSalesReturns(json.data.salesReturns);
          }
          if (Array.isArray(json.data.payments)) {
            setPayments(json.data.payments);
          }
          if (json.data.ledgerEntries && typeof json.data.ledgerEntries === 'object') {
            setLedgerEntries(json.data.ledgerEntries);
          }
          if (Array.isArray(json.data.inventoryTransactions)) {
            setInventoryTransactions(json.data.inventoryTransactions);
          }
          if (Array.isArray(json.data.expenses)) {
            setExpenses(json.data.expenses);
          }
          if (Array.isArray(json.data.dailyClosings) && json.data.dailyClosings.length > 0) {
            setDailyClosings(json.data.dailyClosings);
            dailyClosingsRef.current = json.data.dailyClosings;
          }
          if (Array.isArray(json.data.badDebts)) {
            setBadDebts(json.data.badDebts);
          }
          if (Array.isArray(json.data.badDebtRecoveries)) {
            setBadDebtRecoveries(json.data.badDebtRecoveries);
          }
          if (Array.isArray(json.data.damagedStockRecords)) {
            setDamagedStockRecords(json.data.damagedStockRecords);
          }
          if (Array.isArray(json.data.expiryRecords)) {
            setExpiryRecords(json.data.expiryRecords);
          }
          if (Array.isArray(json.data.staff)) {
            setStaff(json.data.staff);
          }
          if (Array.isArray(json.data.auditLogs)) {
            setAuditLogs(json.data.auditLogs);
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
    const closing = dailyClosingsRef.current.find(c => c.date === dateStr) || dailyClosings.find(c => c.date === dateStr);
    return closing?.status === 'CLOSED';
  };

  // Areas
  const addArea = (areaData: Omit<Area, 'id' | 'createdAt'>): Area => {
    const code = areaData.code || generateNextSequenceNumber('ARA-', areas.map(a => a.code), 10, 2);
    const newArea: Area = {
      ...areaData,
      code,
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
    const clientId = generateNextSequenceNumber('CLT-', clients.map(c => c.clientId), 1001);
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
      return updated;
    });
    syncMutation('client', 'delete', undefined, id);
    addAuditLog('Deleted Client', 'Clients', target?.clientId || id, `Removed client ${target?.companyName}`);
  };

  // Product operations
  const addProduct = (productData: Omit<Product, 'id' | 'reservedStock' | 'availableStock' | 'status'>): Product => {
    const sku = productData.sku || generateNextSequenceNumber('SKU-', products.map(p => p.sku), 1001);
    const currentStock = productData.currentStock || 0;
    const minStock = productData.minStockLevel || 20;
    let status: Product['status'] = 'In Stock';
    if (currentStock === 0) status = 'Out of Stock';
    else if (currentStock <= minStock) status = 'Low Stock';

    const newProduct: Product = {
      ...productData,
      sku,
      id: generateUUID(),
      currentStock,
      reservedStock: 0,
      availableStock: currentStock,
      status,
    };

    productsRef.current = [newProduct, ...productsRef.current];

    setProducts(prev => {
      const next = [newProduct, ...prev];
      return next;
    });

    // Record initial opening stock transaction if stock > 0
    if (currentStock > 0) {
      const tx: InventoryTransaction = {
        id: generateUUID(),
        date: getTodayKarachiDate(),
        reference: `OPN-${newProduct.sku}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        batch: newProduct.batchNumber,
        type: 'OPENING_STOCK',
        quantity: currentStock,
        unit: newProduct.unit,
        previousStock: 0,
        newStock: currentStock,
        unitCost: newProduct.costPrice,
        totalCost: currentStock * newProduct.costPrice,
        user: currentUser?.name || 'Inventory Manager',
        notes: 'Initial product opening stock inventory balance',
        supplier: newProduct.supplier,
        warehouse: 'Khuram Chowk Warehouse',
      };

      setInventoryTransactions(prev => {
        const next = [tx, ...prev];
        return next;
      });
      syncMutation('inventory_tx', 'upsert', tx);
    }

    addAuditLog('Added Product', 'Inventory', newProduct.sku, `Added product ${newProduct.name} (${newProduct.category})`);
    syncMutation('product', 'upsert', newProduct);
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    let updatedProduct: Product | undefined;
    setProducts(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...productData };
        const avail = updated.currentStock - updated.reservedStock;
        let status: Product['status'] = 'In Stock';
        if (updated.currentStock === 0) status = 'Out of Stock';
        else if (updated.currentStock <= updated.minStockLevel) status = 'Low Stock';
        updatedProduct = { ...updated, availableStock: Math.max(0, avail), status };
        return updatedProduct;
      });
      return next;
    });

    if (updatedProduct) {
      productsRef.current = productsRef.current.map(p => (p.id === id ? updatedProduct! : p));
      syncMutation('product', 'upsert', updatedProduct);
    }
    addAuditLog('Updated Product', 'Inventory', id, `Updated product attributes`);
  };

  const deleteProduct = (id: string) => {
    const target = productsRef.current.find(p => p.id === id) || products.find(p => p.id === id);
    productsRef.current = productsRef.current.filter(p => p.id !== id);
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      return updated;
    });
    syncMutation('product', 'delete', undefined, id);
    addAuditLog('Deleted Product', 'Inventory', target?.sku || id, `Deleted product ${target?.name || id}`);
  };

  const adjustProductStock = (productId: string, newStock: number, reason?: string) => {
    const product = productsRef.current.find(p => p.id === productId) || products.find(p => p.id === productId);
    if (!product) return;
    const prevStock = product.currentStock;
    const targetStock = Math.max(0, Number(newStock));
    const delta = targetStock - prevStock;
    if (delta === 0) return;

    const avail = Math.max(0, targetStock - product.reservedStock);
    let status: Product['status'] = 'In Stock';
    if (targetStock === 0) status = 'Out of Stock';
    else if (targetStock <= product.minStockLevel) status = 'Low Stock';

    const updatedProduct: Product = {
      ...product,
      currentStock: targetStock,
      availableStock: avail,
      status,
    };

    productsRef.current = productsRef.current.map(p => (p.id === productId ? updatedProduct : p));

    setProducts(prev => {
      const next = prev.map(p => (p.id === productId ? updatedProduct : p));
      return next;
    });

    syncMutation('product', 'upsert', updatedProduct);

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

    setInventoryTransactions(prev => {
      const next = [tx, ...prev];
      return next;
    });
    syncMutation('inventory_tx', 'upsert', tx);

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
    setAuditLogs([]);

    if (typeof window !== 'undefined') {
      const businessKeys = [
        'ahmad_areas', 'ahmad_clients', 'ahmad_products', 'ahmad_suppliers',
        'ahmad_supplier_payments', 'ahmad_purchases', 'ahmad_purchase_returns',
        'ahmad_orders', 'ahmad_sales_returns', 'ahmad_payments', 'ahmad_ledgers',
        'ahmad_stock_tx', 'ahmad_daily_closings', 'ahmad_expenses', 'ahmad_bad_debts',
        'ahmad_bad_debt_recoveries', 'ahmad_damaged_stock', 'ahmad_expiry_records',
        'ahmad_audit_logs', 'ahmad_staff', 'ahmad_wiped_to_zero_v4', 'ahmad_wiped_to_zero_v5',
        'eplanet_areas', 'eplanet_clients', 'eplanet_products', 'eplanet_suppliers',
        'eplanet_supplier_payments', 'eplanet_purchases', 'eplanet_purchase_returns',
        'eplanet_orders', 'eplanet_sales_returns', 'eplanet_payments', 'eplanet_ledgers',
        'eplanet_stock_tx', 'eplanet_daily_closings', 'eplanet_expenses', 'eplanet_bad_debts',
        'eplanet_bad_debt_recoveries', 'eplanet_damaged_stock', 'eplanet_expiry_records',
        'eplanet_audit_logs', 'eplanet_staff'
      ];
      businessKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });
    }

    addAuditLog('Portal Data Reset', 'System', 'RESET', 'All portal data wiped to 0. Fresh start initialized.');
  };

  // Suppliers & Supplier Payments
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'supplierId' | 'currentPayable' | 'createdAt'>): Supplier => {
    const supplierId = generateNextSequenceNumber('SUP-', suppliers.map(s => s.supplierId), 101);
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
      return updated;
    });
    syncMutation('supplier', 'delete', undefined, id);
    addAuditLog('Deleted Supplier', 'Purchases', target?.supplierId || id, `Deleted supplier ${target?.name || id}`);
  };

  const recordSupplierPayment = (paymentData: Omit<SupplierPayment, 'id' | 'paymentNumber'>): SupplierPayment => {
    const paymentNumber = generateNextSequenceNumber('SPAY-', supplierPayments.map(p => p.paymentNumber), 1001);
    const newPayment: SupplierPayment = {
      ...paymentData,
      id: generateUUID(),
      paymentNumber,
    };
    setSupplierPayments(prev => [newPayment, ...prev]);

    // Reduce supplier payable balance (Does NOT affect operational expense or sales)
    let updatedSupplier: Supplier | undefined;
    const supp = suppliersRef.current.find(s => s.id === paymentData.supplierId) || suppliers.find(s => s.id === paymentData.supplierId);
    if (supp) {
      updatedSupplier = {
        ...supp,
        currentPayable: Math.max(0, supp.currentPayable - paymentData.amount),
      };
      suppliersRef.current = suppliersRef.current.map(s => (s.id === paymentData.supplierId ? updatedSupplier! : s));
      setSuppliers(prev => {
        const next = prev.map(s => (s.id === paymentData.supplierId ? updatedSupplier! : s));
        return next;
      });
      syncMutation('supplier', 'upsert', updatedSupplier);
    }

    addAuditLog('Supplier Payment', 'Finance', paymentNumber, `Paid Rs. ${paymentData.amount.toLocaleString()} to ${paymentData.supplierName}`);
    syncMutation('supplier_payment', 'upsert', newPayment);
    return newPayment;
  };

  // Purchases
  const createPurchase = (purchaseData: Omit<Purchase, 'id' | 'invoiceNumber' | 'createdAt'>): Purchase => {
    const invoiceNumber = generateNextSequenceNumber('PINV-', purchases.map(p => p.invoiceNumber), 5001);
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
          const updatedExp: ExpiryRecord = { ...existingExp, quantity: existingExp.quantity + item.quantity };
          setExpiryRecords(prev =>
            prev.map(e =>
              e.id === existingExp.id ? updatedExp : e
            )
          );
          syncMutation('expiry_record', 'upsert', updatedExp);
        } else {
          const newExp: ExpiryRecord = {
            id: generateUUID(),
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
          syncMutation('expiry_record', 'upsert', newExp);
        }
      }
    });

    // 2. Increase supplier payable by remaining unpaid balance
    if (purchase.remainingPayable > 0) {
      const supp = suppliersRef.current.find(s => s.id === purchase.supplierId) || suppliers.find(s => s.id === purchase.supplierId);
      if (supp) {
        const updatedSupplier: Supplier = {
          ...supp,
          currentPayable: supp.currentPayable + purchase.remainingPayable,
        };
        suppliersRef.current = suppliersRef.current.map(s => (s.id === purchase.supplierId ? updatedSupplier : s));
        setSuppliers(prev => {
          const next = prev.map(s => (s.id === purchase.supplierId ? updatedSupplier : s));
          return next;
        });
        syncMutation('supplier', 'upsert', updatedSupplier);
      }
    }
  };

  const postPurchase = (purchaseId: string): boolean => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return false;
    if (purchase.status === 'Posted') return true; // Already posted, prevent duplicate

    if (isDateClosed(purchase.purchaseDate)) {
      throw new Error(`Cannot post purchase: Business day ${formatDateDDMMYYYY(purchase.purchaseDate)} is closed.`);
    }

    const updatedPurchase: Purchase = { ...purchase, status: 'Posted' };
    setPurchases(prev => prev.map(p => (p.id === purchaseId ? updatedPurchase : p)));
    syncMutation('purchase', 'upsert', updatedPurchase);
    applyPostedPurchase(updatedPurchase);
    addAuditLog('Posted Purchase', 'Purchases', purchase.invoiceNumber, `Posted purchase #${purchase.invoiceNumber} into inventory`);
    return true;
  };

  const recordPurchaseReturn = (returnData: Omit<PurchaseReturn, 'id' | 'returnNumber' | 'status'>): PurchaseReturn => {
    const returnNumber = generateNextSequenceNumber('PRTN-', purchaseReturns.map(r => r.returnNumber), 1001);
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
    const supp = suppliersRef.current.find(s => s.id === newReturn.supplierId) || suppliers.find(s => s.id === newReturn.supplierId);
    if (supp) {
      const updatedSupplier: Supplier = {
        ...supp,
        currentPayable: Math.max(0, supp.currentPayable - newReturn.refundAmount),
      };
      suppliersRef.current = suppliersRef.current.map(s => (s.id === newReturn.supplierId ? updatedSupplier : s));
      setSuppliers(prev => {
        const next = prev.map(s => (s.id === newReturn.supplierId ? updatedSupplier : s));
        return next;
      });
      syncMutation('supplier', 'upsert', updatedSupplier);
    }

    // 3. Mark the original purchase as Returned so it is removed from active Daily Purchases!
    const targetPurchase = purchases.find(p => p.id === newReturn.purchaseId || p.invoiceNumber === newReturn.purchaseInvoiceNumber);
    if (targetPurchase) {
      const updatedPurchase: Purchase = { ...targetPurchase, status: 'Returned' };
      setPurchases(prev => {
        const next = prev.map(p => (p.id === targetPurchase.id ? updatedPurchase : p));
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

    const returnNumber = generateNextSequenceNumber('PRTN-', purchaseReturns.map(r => r.returnNumber), 1001);
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
    const supp = suppliersRef.current.find(s => s.id === purchase.supplierId) || suppliers.find(s => s.id === purchase.supplierId);
    if (supp) {
      const updatedSupplier: Supplier = {
        ...supp,
        currentPayable: Math.max(0, supp.currentPayable - payableToReduce),
      };
      suppliersRef.current = suppliersRef.current.map(s => (s.id === purchase.supplierId ? updatedSupplier : s));
      setSuppliers(prev => {
        const next = prev.map(s => (s.id === purchase.supplierId ? updatedSupplier : s));
        return next;
      });
      syncMutation('supplier', 'upsert', updatedSupplier);
    }

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
      return next;
    });

    // 4. Update the purchase status to 'Returned' and sync
    const updatedPurchase: Purchase = { ...purchase, status: 'Returned' };
    setPurchases(prev => {
      const next = prev.map(p => (p.id === purchase.id ? updatedPurchase : p));
      return next;
    });

    addAuditLog('Purchase Return', 'Purchases', returnNumber, `Returned purchase #${purchase.invoiceNumber} to ${purchase.supplierName} (Refund: Rs. ${purchase.grandTotal.toLocaleString()}). Removed from Daily Purchases.`);
    syncMutation('purchase_return', 'upsert', newReturn);
    syncMutation('purchase', 'upsert', updatedPurchase);

    return newReturn;
  };

  // Sales Orders (Party-wise daily sales)
  const createOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>
  ): Promise<{ success: boolean; order?: Order; error?: string }> => {
    // 1. Check if the business day is closed
    if (isDateClosed(orderData.orderDate)) {
      return {
        success: false,
        error: `Business day ${formatDateDDMMYYYY(orderData.orderDate)} is CLOSED. Reopen day first to record sales.`,
      };
    }

    // 2. Check stock availability for every line
    const currentProds = productsRef.current.length > 0 ? productsRef.current : products;
    for (const item of orderData.items) {
      const prod = currentProds.find(p => p.id === item.productId) || products.find(p => p.id === item.productId);
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

    // 3. Generate unique sequential invoice number
    const orderNumber = generateNextSequenceNumber('INV-', orders.map(o => o.orderNumber), 9001);
    const newOrder: Order = {
      ...orderData,
      id: generateUUID(),
      items: orderData.items.map(it => ({ ...it, id: generateUUID() })),
      orderNumber,
      status: orderData.status || 'Posted',
      createdAt: getTodayKarachiDate(),
    };

    // 4. Save directly to Supabase first to ensure persistence
    const syncRes = await syncMutation('order', 'upsert', newOrder);
    if (!syncRes.success) {
      console.error('[createOrder] Supabase sync error:', syncRes.error);
      return {
        success: false,
        error: `Database sync error: Could not save invoice to Supabase (${syncRes.error}). No changes were made.`,
      };
    }

    // 5. Update local state now that Supabase confirmed
    setOrders(prev => {
      const next = [newOrder, ...prev.filter(o => o.id !== newOrder.id && o.orderNumber !== newOrder.orderNumber)];
      return next;
    });

    // 6. Deduct stock for all ordered products
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

    // 7. Update Client Ledger and Receivables
    // Credit amount = grandTotal - amountPaid
    const creditCreated = newOrder.grandTotal - newOrder.amountPaid;
    const client = clientsRef.current.find(c => c.id === newOrder.clientId) || clients.find(c => c.id === newOrder.clientId);

    if (client) {
      const existingLedger = ledgerEntries[newOrder.clientId] || [];
      const lastBal = existingLedger.length > 0 ? existingLedger[existingLedger.length - 1].balance : client.currentBalance;
      const newBal = lastBal + creditCreated;

      const ledgerEntry: LedgerEntry = {
        id: generateUUID(),
        clientId: newOrder.clientId,
        date: newOrder.orderDate,
        reference: orderNumber,
        type: newOrder.amountPaid > 0 && creditCreated > 0 ? 'Invoice' : creditCreated > 0 ? 'Credit Sale' : 'Cash Sale',
        description: `Sale #${orderNumber} (${newOrder.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')})`,
        debit: newOrder.grandTotal,
        credit: newOrder.amountPaid, // Direct cash credit against this invoice
        balance: newBal,
      };

      setLedgerEntries(prev => {
        const next = {
          ...prev,
          [newOrder.clientId]: [...(prev[newOrder.clientId] || []), ledgerEntry],
        };
        return next;
      });
      syncMutation('ledger', 'upsert', ledgerEntry);

      // Update client balance & purchases
      const updatedClient: Client = {
        ...client,
        totalPurchases: client.totalPurchases + newOrder.grandTotal,
        currentBalance: client.currentBalance + creditCreated,
        totalPaid: client.totalPaid + newOrder.amountPaid,
        lastTransactionDate: newOrder.orderDate,
      };

      clientsRef.current = clientsRef.current.map(c => (c.id === newOrder.clientId ? updatedClient : c));

      setClients(prev => {
        const next = prev.map(c => (c.id === newOrder.clientId ? updatedClient : c));
        return next;
      });
      syncMutation('client', 'upsert', updatedClient);
    }

    addAuditLog('Created Sale', 'Sales', orderNumber, `Sale #${orderNumber} for ${newOrder.companyName} - Total: Rs. ${newOrder.grandTotal.toLocaleString()}, Cash: Rs. ${newOrder.amountPaid.toLocaleString()}, Credit: Rs. ${creditCreated.toLocaleString()}`);
    return { success: true, order: newOrder };
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id === orderId) {
          const updated = { ...o, status };
          syncMutation('order', 'upsert', updated);
          return updated;
        }
        return o;
      });
      return next;
    });
    addAuditLog('Updated Order Status', 'Sales', orderId, `Changed order status to ${status}`);
  };

  const updateOrderPaymentStatus = (orderId: string, paymentStatus: 'Paid' | 'Unpaid') => {
    const targetOrder = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!targetOrder) return;
    if (targetOrder.paymentStatus === paymentStatus) return;

    const grandTotal = targetOrder.grandTotal;
    const oldAmountPaid = targetOrder.amountPaid || 0;
    const newAmountPaid = paymentStatus === 'Paid' ? grandTotal : 0;
    const newAmountRemaining = paymentStatus === 'Paid' ? 0 : grandTotal;
    const paidDiff = newAmountPaid - oldAmountPaid;

    const updatedOrder: Order = {
      ...targetOrder,
      paymentStatus,
      amountPaid: newAmountPaid,
      paidAmount: newAmountPaid,
      amountRemaining: newAmountRemaining,
      remainingAmount: newAmountRemaining,
    };

    setOrders(prev => {
      const next = prev.map(o => (o.id === targetOrder.id ? updatedOrder : o));
      return next;
    });

    // Update Client balance and Ledger
    const client = clientsRef.current.find(c => c.id === targetOrder.clientId) || clients.find(c => c.id === targetOrder.clientId);
    if (client && paidDiff !== 0) {
      const existingLedger = ledgerEntries[targetOrder.clientId] || [];
      const lastBal = existingLedger.length > 0 ? existingLedger[existingLedger.length - 1].balance : client.currentBalance;
      const newBal = lastBal - paidDiff;
      const today = getTodayKarachiDate();

      const ledgerEntry: LedgerEntry = {
        id: generateUUID(),
        clientId: targetOrder.clientId,
        date: today,
        reference: targetOrder.orderNumber,
        type: paidDiff > 0 ? 'Payment Received' : 'Reversal',
        description: paidDiff > 0
          ? `Payment received for Invoice #${targetOrder.orderNumber} (Marked as Paid)`
          : `Payment reversed to Unpaid for Invoice #${targetOrder.orderNumber}`,
        debit: paidDiff < 0 ? Math.abs(paidDiff) : 0,
        credit: paidDiff > 0 ? paidDiff : 0,
        balance: newBal,
        notes: `Payment status updated to ${paymentStatus}`,
      };

      setLedgerEntries(prev => {
        const next = {
          ...prev,
          [targetOrder.clientId]: [...(prev[targetOrder.clientId] || []), ledgerEntry],
        };
        return next;
      });
      syncMutation('ledger', 'upsert', ledgerEntry);

      const updatedClient: Client = {
        ...client,
        totalPaid: Math.max(0, client.totalPaid + paidDiff),
        currentBalance: Math.max(0, client.currentBalance - paidDiff),
        lastTransactionDate: today,
      };

      clientsRef.current = clientsRef.current.map(c => (c.id === targetOrder.clientId ? updatedClient : c));

      setClients(prev => {
        const next = prev.map(c => (c.id === targetOrder.clientId ? updatedClient : c));
        return next;
      });
      syncMutation('client', 'upsert', updatedClient);
    }

    addAuditLog(
      'Updated Payment Status',
      'Sales',
      targetOrder.orderNumber,
      `Changed payment status of Invoice #${targetOrder.orderNumber} to ${paymentStatus} (Amount: Rs. ${grandTotal.toLocaleString()})`
    );

    syncMutation('order', 'upsert', updatedOrder);
  };

  // Sales Returns
  const recordSalesReturn = (returnData: Omit<SalesReturn, 'id' | 'returnNumber' | 'status'>): SalesReturn => {
    const returnNumber = generateNextSequenceNumber('SRTN-', salesReturns.map(r => r.returnNumber), 1001);
    const newReturn: SalesReturn = {
      ...returnData,
      id: generateUUID(),
      returnNumber,
      status: 'Completed',
    };

    setSalesReturns(prev => {
      const next = [newReturn, ...prev];
      return next;
    });

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
      const prod = productsRef.current.find(p => p.id === newReturn.productId) || products.find(p => p.id === newReturn.productId);
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
      setDamagedStockRecords(prev => {
        const next = [...prev, damagedRecord];
        return next;
      });
      syncMutation('damaged_stock', 'upsert', damagedRecord);
    }

    // 2. Adjust customer ledger & receivable
    const client = clientsRef.current.find(c => c.id === newReturn.clientId) || clients.find(c => c.id === newReturn.clientId);
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

      setLedgerEntries(prev => {
        const next = {
          ...prev,
          [newReturn.clientId]: [...(prev[newReturn.clientId] || []), ledgerEntry],
        };
        return next;
      });
      syncMutation('ledger', 'upsert', ledgerEntry);

      const updatedClient: Client = {
        ...client,
        totalPurchases: Math.max(0, client.totalPurchases - newReturn.refundAmount),
        currentBalance: Math.max(0, client.currentBalance - newReturn.refundAmount),
        lastTransactionDate: newReturn.returnDate,
      };

      clientsRef.current = clientsRef.current.map(c => (c.id === newReturn.clientId ? updatedClient : c));

      setClients(prev => {
        const next = prev.map(c => (c.id === newReturn.clientId ? updatedClient : c));
        return next;
      });
      syncMutation('client', 'upsert', updatedClient);
    }

    // 3. Update the original order's item returned quantities and status
    const targetOrder = orders.find(o => o.id === newReturn.orderId || o.orderNumber === newReturn.orderNumber);
    if (targetOrder) {
      const updatedItems = targetOrder.items.map(it => {
        if (it.productId === newReturn.productId) {
          return {
            ...it,
            returnedQuantity: (it.returnedQuantity || 0) + newReturn.quantity,
          };
        }
        return it;
      });
      const isAllReturned = updatedItems.every(it => (it.returnedQuantity || 0) >= it.quantity);
      let newNotes = targetOrder.notes || '';
      if (isAllReturned) {
        if (!newNotes.includes('[RETURNED]')) {
          newNotes = newNotes ? `${newNotes} [RETURNED]` : '[RETURNED]';
        }
      } else {
        if (!newNotes.includes('[PARTIALLY_RETURNED]')) {
          newNotes = newNotes ? `${newNotes} [PARTIALLY_RETURNED]` : '[PARTIALLY_RETURNED]';
        }
      }

      const updatedOrder: Order = {
        ...targetOrder,
        items: updatedItems,
        status: isAllReturned ? 'Returned' : 'Partially Returned',
        returnedAmount: (targetOrder.returnedAmount || 0) + newReturn.refundAmount,
        notes: newNotes,
      };
      setOrders(prev => {
        const next = prev.map(o => (o.id === targetOrder.id ? updatedOrder : o));
        return next;
      });
      syncMutation('order', 'upsert', updatedOrder);
    }

    addAuditLog('Sales Return', 'Sales', returnNumber, `Recorded sales return of ${newReturn.quantity} units from ${newReturn.clientName} (Refund credit: Rs. ${newReturn.refundAmount.toLocaleString()})`);
    syncMutation('sales_return', 'upsert', newReturn);
    return newReturn;
  };

  const returnSale = (orderId: string, options?: ReturnSaleOptions): SalesReturn => {
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const returnNumberBase = generateNextSequenceNumber('SRTN-', salesReturns.map(r => r.returnNumber), 1001);
    const reason = options?.reason || 'Customer sales invoice returned';
    const isResalableGlobal = options?.isResalable !== undefined ? options.isResalable : true;
    const returnDate = getTodayKarachiDate();

    // Determine which items and quantities to return
    let itemsToReturn: {
      orderItem: OrderItem;
      quantity: number;
      isResalable: boolean;
      refundAmount: number;
    }[] = [];

    if (options?.items && options.items.length > 0) {
      // User specified which items and how much to return
      for (const opt of options.items) {
        if (!opt.quantity || opt.quantity <= 0) continue; // 0 means kept by client!
        const orderItem = order.items.find(i => i.productId === opt.productId);
        if (!orderItem) continue;

        const alreadyReturned = orderItem.returnedQuantity || 0;
        const availableToReturn = Math.max(0, orderItem.quantity - alreadyReturned);

        if (opt.quantity > availableToReturn) {
          throw new Error(
            `Cannot return ${opt.quantity} units of ${orderItem.productName}. Maximum available to return is ${availableToReturn}.`
          );
        }

        const itemResalable = opt.isResalable !== undefined ? opt.isResalable : isResalableGlobal;
        const disc = orderItem.discountPercent || 0;
        const unitP = orderItem.unitPrice || 0;
        const lineRefund = Math.round(opt.quantity * unitP * (1 - disc / 100));

        itemsToReturn.push({
          orderItem,
          quantity: opt.quantity,
          isResalable: itemResalable,
          refundAmount: lineRefund,
        });
      }
    } else {
      // Full return: Return all remaining unreturned items
      for (const orderItem of order.items) {
        const alreadyReturned = orderItem.returnedQuantity || 0;
        const availableToReturn = Math.max(0, orderItem.quantity - alreadyReturned);
        if (availableToReturn <= 0) continue;

        const disc = orderItem.discountPercent || 0;
        const unitP = orderItem.unitPrice || 0;
        const lineRefund = Math.round(availableToReturn * unitP * (1 - disc / 100));

        itemsToReturn.push({
          orderItem,
          quantity: availableToReturn,
          isResalable: isResalableGlobal,
          refundAmount: lineRefund,
        });
      }
    }

    if (itemsToReturn.length === 0) {
      throw new Error('Please select at least one item and quantity to return.');
    }

    // Total calculated refund based on selected items
    const calculatedRefundTotal = itemsToReturn.reduce((sum, it) => sum + it.refundAmount, 0);
    const totalRefundAmount = options?.refundAmount !== undefined ? options.refundAmount : calculatedRefundTotal;

    // 1. Restock each returned item (or log damaged stock)
    itemsToReturn.forEach((it, idx) => {
      const returnNumber = itemsToReturn.length > 1 ? `${returnNumberBase}-${idx + 1}` : returnNumberBase;
      if (it.isResalable) {
        recordStockMovement(
          it.orderItem.productId,
          'SALES_RETURN',
          it.quantity,
          returnNumber,
          `Sales Return for #${order.orderNumber}: ${it.orderItem.productName} (${it.quantity} ${it.orderItem.unit})`,
          undefined,
          'Khuram Chowk Warehouse',
          it.orderItem.unit
        );
      } else {
        const prod = productsRef.current.find(p => p.id === it.orderItem.productId) || products.find(p => p.id === it.orderItem.productId);
        const cost = prod?.costPrice || 0;
        const damagedRecord: DamagedStockRecord = {
          id: generateUUID(),
          productId: it.orderItem.productId,
          productName: it.orderItem.productName,
          category: prod?.category || 'Cold Drinks',
          batch: it.orderItem.batch || 'RETURN-DAMAGED',
          quantity: it.quantity,
          unit: it.orderItem.unit,
          unitCost: cost,
          totalLoss: it.quantity * cost,
          date: returnDate,
          reason: `Returned damaged from #${order.orderNumber}: ${reason}`,
          recordedBy: currentUser?.name || 'Sales Staff',
        };
        setDamagedStockRecords(prev => {
          const next = [...prev, damagedRecord];
          return next;
        });
        syncMutation('damaged_stock', 'upsert', damagedRecord);
      }
    });

    // 2. Adjust customer ledger & balance
    const client = clientsRef.current.find(c => c.id === order.clientId) || clients.find(c => c.id === order.clientId);
    if (client) {
      const existingLedger = ledgerEntries[order.clientId] || [];
      const lastBal = existingLedger.length > 0 ? existingLedger[existingLedger.length - 1].balance : client.currentBalance;
      const creditToReverse = order.amountRemaining > 0 ? Math.min(order.amountRemaining, totalRefundAmount) : 0;
      const effectiveReduction = creditToReverse > 0 ? creditToReverse : totalRefundAmount;
      const newBal = Math.max(0, lastBal - effectiveReduction);

      const itemsSummary = itemsToReturn.map(i => `${i.quantity}x ${i.orderItem.productName}`).join(', ');
      const ledgerEntry: LedgerEntry = {
        id: 'led-' + Date.now(),
        clientId: order.clientId,
        date: returnDate,
        reference: returnNumberBase,
        type: 'Sales Return',
        description: `Sales return for #${order.orderNumber} (${itemsSummary})`,
        debit: 0,
        credit: effectiveReduction,
        balance: newBal,
        notes: reason,
      };

      setLedgerEntries(prev => {
        const next = {
          ...prev,
          [order.clientId]: [...(prev[order.clientId] || []), ledgerEntry],
        };
        return next;
      });
      syncMutation('ledger', 'upsert', ledgerEntry);

      const updatedClient: Client = {
        ...client,
        totalPurchases: Math.max(0, client.totalPurchases - totalRefundAmount),
        currentBalance: Math.max(0, client.currentBalance - effectiveReduction),
        lastTransactionDate: returnDate,
      };

      clientsRef.current = clientsRef.current.map(c => (c.id === order.clientId ? updatedClient : c));

      setClients(prev => {
        const next = prev.map(c => (c.id === order.clientId ? updatedClient : c));
        return next;
      });
      syncMutation('client', 'upsert', updatedClient);
    }

    // 3. Create SalesReturn record for each returned item
    const createdSalesReturns: SalesReturn[] = itemsToReturn.map((it, idx) => {
      const returnNumber = itemsToReturn.length > 1 ? `${returnNumberBase}-${idx + 1}` : returnNumberBase;
      const sr: SalesReturn = {
        id: generateUUID(),
        returnNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        clientId: order.clientId,
        clientName: order.companyName,
        productId: it.orderItem.productId,
        productName: it.orderItem.productName,
        quantity: it.quantity,
        unit: it.orderItem.unit,
        batch: it.orderItem.batch || 'RETURN',
        returnDate,
        refundAmount: it.refundAmount,
        isResalable: it.isResalable,
        reason,
        status: 'Completed',
      };
      return sr;
    });

    setSalesReturns(prev => {
      const next = [...createdSalesReturns, ...prev];
      return next;
    });
    createdSalesReturns.forEach(sr => syncMutation('sales_return', 'upsert', sr));

    // 4. Update order items returnedQuantity and check if all items are fully returned
    const updatedOrderItems = order.items.map(item => {
      const returnedEntry = itemsToReturn.find(r => r.orderItem.productId === item.productId);
      if (returnedEntry) {
        const newReturnedQty = (item.returnedQuantity || 0) + returnedEntry.quantity;
        return {
          ...item,
          returnedQuantity: newReturnedQty,
        };
      }
      return item;
    });

    const isFullyReturned = updatedOrderItems.every(i => (i.returnedQuantity || 0) >= i.quantity);
    const newReturnedAmountTotal = (order.returnedAmount || 0) + totalRefundAmount;
    const newRemainingPayable = Math.max(0, order.amountRemaining - totalRefundAmount);

    let updatedStatus: OrderStatus = order.status;
    let orderNotes = order.notes || '';

    if (isFullyReturned) {
      updatedStatus = 'Returned';
      if (!orderNotes.includes('[RETURNED]')) {
        orderNotes = orderNotes ? `${orderNotes} [RETURNED]` : '[RETURNED]';
      }
    } else {
      updatedStatus = 'Partially Returned';
      if (!orderNotes.includes('[PARTIALLY_RETURNED]')) {
        orderNotes = orderNotes ? `${orderNotes} [PARTIALLY_RETURNED]` : '[PARTIALLY_RETURNED]';
      }
    }

    const updatedOrder: Order = {
      ...order,
      items: updatedOrderItems,
      status: updatedStatus,
      returnedAmount: newReturnedAmountTotal,
      amountRemaining: newRemainingPayable,
      paymentStatus: newRemainingPayable === 0 && !isFullyReturned ? 'Paid' : order.paymentStatus,
      notes: orderNotes,
    };

    setOrders(prev => {
      const next = prev.map(o => (o.id === order.id ? updatedOrder : o));
      return next;
    });

    addAuditLog(
      'Sales Return',
      'Sales',
      returnNumberBase,
      `Returned ${isFullyReturned ? 'full' : 'partial'} sale #${order.orderNumber} for ${order.companyName} (${itemsToReturn.length} SKU(s), Refund: Rs. ${totalRefundAmount.toLocaleString()}).`
    );
    syncMutation('order', 'upsert', updatedOrder);

    return createdSalesReturns[0];
  };

  // Customer Collections (Reduces receivable, NEVER counted as a new sale)
  const recordPayment = (paymentData: Omit<Payment, 'id' | 'paymentNumber' | 'status'>): { success: boolean; payment?: Payment; error?: string } => {
    if (isDateClosed(paymentData.paymentDate)) {
      return {
        success: false,
        error: `Business day ${formatDateDDMMYYYY(paymentData.paymentDate)} is CLOSED. Cannot record collections.`,
      };
    }

    const paymentNumber = generateNextSequenceNumber('RCT-', payments.map(p => p.paymentNumber), 2001);
    const newPayment: Payment = {
      ...paymentData,
      id: generateUUID(),
      paymentNumber,
      status: 'Completed',
    };

    setPayments(prev => {
      const next = [newPayment, ...prev];
      return next;
    });

    // Update Client balance and Ledger
    const client = clientsRef.current.find(c => c.id === paymentData.clientId) || clients.find(c => c.id === paymentData.clientId);
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

      setLedgerEntries(prev => {
        const next = {
          ...prev,
          [paymentData.clientId]: [...(prev[paymentData.clientId] || []), ledgerEntry],
        };
        return next;
      });
      syncMutation('ledger', 'upsert', ledgerEntry);

      const updatedClient: Client = {
        ...client,
        totalPaid: client.totalPaid + paymentData.amount,
        currentBalance: client.currentBalance - paymentData.amount,
        lastTransactionDate: paymentData.paymentDate,
      };

      clientsRef.current = clientsRef.current.map(c => (c.id === paymentData.clientId ? updatedClient : c));

      setClients(prev => {
        const next = prev.map(c => (c.id === paymentData.clientId ? updatedClient : c));
        return next;
      });
      syncMutation('client', 'upsert', updatedClient);
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
    const product = productsRef.current.find(p => p.id === productId) || products.find(p => p.id === productId);
    if (!product) return;

    const prevStock = product.currentStock;
    const newStock = Math.max(0, prevStock + quantity);
    const avail = newStock - product.reservedStock;
    let status: Product['status'] = 'In Stock';
    if (newStock === 0) status = 'Out of Stock';
    else if (newStock <= product.minStockLevel) status = 'Low Stock';

    const updatedProduct: Product = {
      ...product,
      currentStock: newStock,
      availableStock: Math.max(0, avail),
      status,
    };

    productsRef.current = productsRef.current.map(p => (p.id === productId ? updatedProduct : p));

    setProducts(prev => {
      const next = prev.map(p => (p.id === productId ? updatedProduct : p));
      return next;
    });

    // Sync updated product to Supabase
    syncMutation('product', 'upsert', updatedProduct);

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

    setInventoryTransactions(prev => {
      const next = [tx, ...prev];
      return next;
    });
    syncMutation('inventory_tx', 'upsert', tx);
    addAuditLog('Stock Movement', 'Inventory', reference, `${type} of ${Math.abs(quantity)} units for ${product.name}`);
  };

  // Daily Closing Stock & Reconciliation
  const getDailyClosingForDate = (dateStr: string): DailyClosing => {
    const existing = dailyClosingsRef.current.find(c => c.date === dateStr) || dailyClosings.find(c => c.date === dateStr);
    if (existing) return existing;

    // Calculate dynamic closing stock line items for this date
    const currentProducts = productsRef.current.length > 0 ? productsRef.current : products;
    const items: DailyClosingItem[] = currentProducts.map(prod => {
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
      id: ensureUUID('cls-' + dateStr, '90000001'),
      date: dateStr,
      status: 'OPEN',
      items,
    };
    return newClosing;
  };

  const saveDailyClosingCount = (dateStr: string, updatedItems: DailyClosingItem[]) => {
    const existing = dailyClosingsRef.current.find(c => c.date === dateStr) || dailyClosings.find(c => c.date === dateStr);
    const updatedRecord: DailyClosing = existing
      ? { ...existing, items: updatedItems, status: existing.status === 'CLOSED' ? 'CLOSED' : 'RECONCILIATION' }
      : { id: ensureUUID('cls-' + dateStr, '90000001'), date: dateStr, status: 'RECONCILIATION', items: updatedItems };

    dailyClosingsRef.current = dailyClosingsRef.current.some(c => c.date === dateStr)
      ? dailyClosingsRef.current.map(c => (c.date === dateStr ? updatedRecord : c))
      : [...dailyClosingsRef.current, updatedRecord];

    setDailyClosings(prev => {
      const idx = prev.findIndex(c => c.date === dateStr);
      let next: DailyClosing[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedRecord;
      } else {
        next = [...prev, updatedRecord];
      }
      return next;
    });

    addAuditLog('Reconciliation Count', 'Closing', dateStr, `Updated physical stock counts for ${formatDateDDMMYYYY(dateStr)}`);
    syncMutation('daily_closing', 'upsert', updatedRecord);
  };

  const closeBusinessDay = (dateStr: string, closedBy: string): boolean => {
    const existing = dailyClosingsRef.current.find(c => c.date === dateStr) || dailyClosings.find(c => c.date === dateStr) || getDailyClosingForDate(dateStr);
    const updatedRecord: DailyClosing = {
      ...existing,
      id: existing.id || ensureUUID('cls-' + dateStr, '90000001'),
      date: dateStr,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy,
    };

    dailyClosingsRef.current = dailyClosingsRef.current.some(c => c.date === dateStr)
      ? dailyClosingsRef.current.map(c => (c.date === dateStr ? updatedRecord : c))
      : [...dailyClosingsRef.current, updatedRecord];

    setDailyClosings(prev => {
      const idx = prev.findIndex(c => c.date === dateStr);
      let next: DailyClosing[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedRecord;
      } else {
        next = [...prev, updatedRecord];
      }
      return next;
    });

    addAuditLog('Closed Business Day', 'Closing', dateStr, `Business day ${formatDateDDMMYYYY(dateStr)} officially CLOSED by ${closedBy}. Transactions locked.`);
    syncMutation('daily_closing', 'upsert', updatedRecord);
    return true;
  };

  const reopenBusinessDay = (dateStr: string, reopenedBy: string, reason: string): boolean => {
    const existing = dailyClosingsRef.current.find(c => c.date === dateStr) || dailyClosings.find(c => c.date === dateStr);
    if (!existing) return false;

    const updatedRecord: DailyClosing = {
      ...existing,
      status: 'OPEN',
      reopenedAt: new Date().toISOString(),
      reopenedBy,
      reopenReason: reason,
    };

    dailyClosingsRef.current = dailyClosingsRef.current.map(c => (c.date === dateStr ? updatedRecord : c));

    setDailyClosings(prev => {
      const next = prev.map(c => (c.date === dateStr ? updatedRecord : c));
      return next;
    });

    addAuditLog('Reopened Business Day', 'Closing', dateStr, `Business day ${formatDateDDMMYYYY(dateStr)} REOPENED by ${reopenedBy}. Reason: ${reason}`);
    syncMutation('daily_closing', 'upsert', updatedRecord);
    return true;
  };

  // Distribution Expenses
  const addExpense = (expenseData: Omit<Expense, 'id' | 'expenseNumber'>): Expense => {
    const expenseNumber = generateNextSequenceNumber('EXP-', expenses.map(e => e.expenseNumber), 101);
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
    const badDebtNumber = generateNextSequenceNumber('BDT-', badDebts.map(b => b.badDebtNumber), 101);
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

    const updatedBadDebt: BadDebt = {
      ...target,
      status: 'Approved',
      approvedBy,
      approvalDate: new Date().toISOString(),
    };

    setBadDebts(prev => {
      const next = prev.map(b => (b.id === id ? updatedBadDebt : b));
      return next;
    });
    syncMutation('bad_debt', 'upsert', updatedBadDebt);

    // Reduce Customer Receivable balance & add ledger entry
    const client = clientsRef.current.find(c => c.id === target.clientId) || clients.find(c => c.id === target.clientId);
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

      setLedgerEntries(prev => {
        const next = {
          ...prev,
          [target.clientId]: [...(prev[target.clientId] || []), ledgerEntry],
        };
        return next;
      });
      syncMutation('ledger', 'upsert', ledgerEntry);

      const updatedClient: Client = {
        ...client,
        currentBalance: Math.max(0, client.currentBalance - target.writeOffAmount),
        lastTransactionDate: getTodayKarachiDate(),
      };

      clientsRef.current = clientsRef.current.map(c => (c.id === target.clientId ? updatedClient : c));

      setClients(prev => {
        const next = prev.map(c => (c.id === target.clientId ? updatedClient : c));
        return next;
      });
      syncMutation('client', 'upsert', updatedClient);
    }

    addAuditLog('Approved Bad Debt', 'Finance', target.badDebtNumber, `Approved bad debt write-off of Rs. ${target.writeOffAmount.toLocaleString()} for ${target.clientName}`);
  };

  const recordBadDebtRecovery = (recoveryData: Omit<BadDebtRecovery, 'id' | 'recoveryNumber'>): BadDebtRecovery => {
    const recoveryNumber = generateNextSequenceNumber('BREC-', badDebtRecoveries.map(r => r.recoveryNumber), 101);
    const newRecovery: BadDebtRecovery = {
      ...recoveryData,
      id: generateUUID(),
      recoveryNumber,
    };
    setBadDebtRecoveries(prev => {
      const next = [newRecovery, ...prev];
      return next;
    });

    // Ledger entry for auditable recovery
    const client = clientsRef.current.find(c => c.id === recoveryData.clientId) || clients.find(c => c.id === recoveryData.clientId);
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

      setLedgerEntries(prev => {
        const next = {
          ...prev,
          [recoveryData.clientId]: [...(prev[recoveryData.clientId] || []), ledgerEntry],
        };
        return next;
      });
      syncMutation('ledger', 'upsert', ledgerEntry);
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

    const updatedRecord: ExpiryRecord = {
      ...record,
      quantity: Math.max(0, record.quantity - quantity),
      status: record.quantity - quantity <= 0 ? 'Written Off' : record.status,
      writtenOffAt: new Date().toISOString(),
      reason,
    };

    // Update expiry record status
    setExpiryRecords(prev => {
      const next = prev.map(e => (e.id === recordId ? updatedRecord : e));
      return next;
    });
    syncMutation('expiry_record', 'upsert', updatedRecord);

    addAuditLog('Expired Stock Write-Off', 'Inventory', record.batch, `Wrote off ${quantity} expired units of ${record.productName} (Cost Loss: Rs. ${(quantity * record.purchaseCost).toLocaleString()})`);
  };

  const recordDamagedStock = (damagedData: Omit<DamagedStockRecord, 'id' | 'totalLoss'>): DamagedStockRecord => {
    const prod = productsRef.current.find(p => p.id === damagedData.productId) || products.find(p => p.id === damagedData.productId);
    const unitCost = damagedData.unitCost || prod?.costPrice || 0;
    const totalLoss = damagedData.quantity * unitCost;

    const newDamaged: DamagedStockRecord = {
      ...damagedData,
      id: generateUUID(),
      unitCost,
      totalLoss,
    };
    setDamagedStockRecords(prev => {
      const next = [...prev, newDamaged];
      return next;
    });
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
        updateOrderPaymentStatus,
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
