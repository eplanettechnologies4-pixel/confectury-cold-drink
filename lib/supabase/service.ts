import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  Product,
  Client,
  Area,
  Supplier,
  SupplierPayment,
  Purchase,
  PurchaseItem,
  Order,
  OrderItem,
  Payment,
  LedgerEntry,
  InventoryTransaction,
  Expense,
  DailyClosing,
  DailyClosingItem,
  BadDebt,
  BadDebtRecovery,
  DamagedStockRecord,
  ExpiryRecord,
  Staff,
  AuditLog,
  PurchaseReturn,
  SalesReturn,
} from '@/types';

// RFC4122 v4 UUID generator and validator
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(str: string | undefined | null): boolean {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Convert non-UUID strings to stable UUIDs if needed
const idMap = new Map<string, string>();
export function ensureUUID(id: string | undefined | null, prefix = '00000000'): string {
  if (!id) return generateUUID();
  if (isValidUUID(id)) return id;
  if (idMap.has(id)) return idMap.get(id)!;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const generated = `${prefix}-0000-4000-8000-${hex.padEnd(12, '0')}`;
  idMap.set(id, generated);
  return generated;
}

function sanitizeDate(dateStr: string | undefined | null): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

function sanitizeTimestamptz(dateStr: string | undefined | null): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return null;
}

// Get server-side service client
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) return null;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// -------------------------------------------------------------------------
// TRANSFORMERS: TypeScript Model <-> Supabase DB Row
// -------------------------------------------------------------------------

export const mappers = {
  // AREAS
  areaToDb(a: Area) {
    return {
      id: ensureUUID(a.id, '10000001'),
      code: a.code,
      name: a.name,
      description: a.description || null,
      assigned_salesperson: a.assignedSalesperson || null,
      status: a.status || 'Active',
      created_at: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
    };
  },
  areaFromDb(row: any): Area {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description || '',
      assignedSalesperson: row.assigned_salesperson || '',
      status: row.status || 'Active',
      createdAt: row.created_at ? row.created_at.split('T')[0] : '',
    };
  },

  // CLIENTS
  clientToDb(c: Client) {
    return {
      id: ensureUUID(c.id, '20000001'),
      client_id: c.clientId,
      name: c.name,
      company_name: c.companyName,
      client_type: c.clientType,
      party_category: c.partyCategory || 'B',
      phone: c.phone,
      alternate_phone: c.alternatePhone || null,
      email: c.email || null,
      tax_id: c.taxId || null,
      status: c.status || 'Active',
      address: typeof c.address === 'object' ? c.address.address || '' : c.address || '',
      city: typeof c.address === 'object' ? c.address.city || 'Faisalabad' : 'Faisalabad',
      area: c.area || (typeof c.address === 'object' ? c.address.area || '' : ''),
      postal_code: typeof c.address === 'object' ? c.address.postalCode || '' : '',
      area_id: isValidUUID(c.areaId) ? c.areaId : null,
      sales_rep: c.salesRep,
      credit_limit: Number(c.creditLimit) || 0,
      payment_terms: c.paymentTerms || 'Cash',
      opening_balance: Number(c.openingBalance) || 0,
      balance_type: c.balanceType || 'Receivable',
      total_purchases: Number(c.totalPurchases) || 0,
      total_paid: Number(c.totalPaid) || 0,
      current_balance: Number(c.currentBalance) || 0,
      last_transaction_date: sanitizeDate(c.lastTransactionDate),
      notes: c.notes || null,
      created_at: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    };
  },
  clientFromDb(row: any): Client {
    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      companyName: row.company_name,
      clientType: row.client_type,
      partyCategory: row.party_category || 'B',
      phone: row.phone,
      alternatePhone: row.alternate_phone || '',
      email: row.email || '',
      taxId: row.tax_id || '',
      status: row.status,
      address: {
        address: row.address || '',
        city: row.city || 'Faisalabad',
        area: row.area || '',
        postalCode: row.postal_code || '',
      },
      areaId: row.area_id || undefined,
      area: row.area || '',
      salesRep: row.sales_rep,
      creditLimit: Number(row.credit_limit) || 0,
      paymentTerms: row.payment_terms || 'Cash',
      openingBalance: Number(row.opening_balance) || 0,
      balanceType: row.balance_type || 'Receivable',
      totalPurchases: Number(row.total_purchases) || 0,
      totalPaid: Number(row.total_paid) || 0,
      currentBalance: Number(row.current_balance) || 0,
      lastTransactionDate: row.last_transaction_date || '',
      notes: row.notes || '',
      createdAt: row.created_at ? row.created_at.split('T')[0] : '',
    };
  },

  // PRODUCTS
  productToDb(p: Product) {
    return {
      id: ensureUUID(p.id, '30000001'),
      sku: p.sku,
      barcode: p.barcode || null,
      name: p.name,
      category: p.category,
      brand: p.brand || 'Ahmad Traders',
      unit: p.unit || 'Piece',
      purchase_unit: p.purchaseUnit || null,
      sales_unit: p.salesUnit || null,
      units_per_carton: p.unitsPerCarton || 24,
      units_per_pack: p.unitsPerPack || 12,
      cost_price: Number(p.costPrice) || 0,
      selling_price: Number(p.sellingPrice) || 0,
      opening_stock: Number(p.openingStock) || 0,
      current_stock: Number(p.currentStock) || 0,
      reserved_stock: Number(p.reservedStock) || 0,
      available_stock: Number(p.availableStock) || 0,
      min_stock_level: Number(p.minStockLevel) || 10,
      supplier: p.supplier || 'Ahmad Traders Supplier',
      supplier_id: isValidUUID(p.supplierId) ? p.supplierId : null,
      description: p.description || null,
      image_url: p.imageUrl || null,
      batch_number: p.batchNumber || null,
      manufacturing_date: sanitizeDate(p.manufacturingDate),
      expiry_date: sanitizeDate(p.expiryDate),
      status: p.status || 'In Stock',
      is_active: p.isActive !== false,
    };
  },
  productFromDb(row: any): Product {
    return {
      id: row.id,
      sku: row.sku,
      barcode: row.barcode || '',
      name: row.name,
      category: row.category,
      brand: row.brand,
      unit: row.unit,
      purchaseUnit: row.purchase_unit || '',
      salesUnit: row.sales_unit || '',
      unitsPerCarton: Number(row.units_per_carton) || 24,
      unitsPerPack: Number(row.units_per_pack) || 12,
      costPrice: Number(row.cost_price) || 0,
      sellingPrice: Number(row.selling_price) || 0,
      openingStock: Number(row.opening_stock) || 0,
      currentStock: Number(row.current_stock) || 0,
      reservedStock: Number(row.reserved_stock) || 0,
      availableStock: Number(row.available_stock) || 0,
      minStockLevel: Number(row.min_stock_level) || 10,
      supplier: row.supplier,
      supplierId: row.supplier_id || undefined,
      description: row.description || '',
      imageUrl: row.image_url || '',
      batchNumber: row.batch_number || '',
      manufacturingDate: row.manufacturing_date || '',
      expiryDate: row.expiry_date || '',
      status: row.status,
      isActive: row.is_active !== false,
    };
  },

  // SUPPLIERS
  supplierToDb(s: Supplier) {
    return {
      id: ensureUUID(s.id, '40000001'),
      supplier_id: s.supplierId,
      name: s.name,
      contact_person: s.contactPerson || s.name,
      phone: s.phone,
      address: s.address,
      opening_payable: Number(s.openingPayable) || 0,
      current_payable: Number(s.currentPayable) || 0,
      payment_terms: s.paymentTerms || '30 Days',
      status: s.status || 'Active',
      notes: s.notes || null,
      created_at: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    };
  },
  supplierFromDb(row: any): Supplier {
    return {
      id: row.id,
      supplierId: row.supplier_id,
      name: row.name,
      contactPerson: row.contact_person,
      phone: row.phone,
      address: row.address,
      openingPayable: Number(row.opening_payable) || 0,
      currentPayable: Number(row.current_payable) || 0,
      paymentTerms: row.payment_terms || '30 Days',
      status: row.status,
      notes: row.notes || '',
      createdAt: row.created_at ? row.created_at.split('T')[0] : '',
    };
  },

  // SUPPLIER PAYMENTS
  supplierPaymentToDb(sp: SupplierPayment) {
    return {
      id: ensureUUID(sp.id, '41000001'),
      payment_number: sp.paymentNumber,
      supplier_id: ensureUUID(sp.supplierId, '40000001'),
      payment_date: sanitizeDate(sp.paymentDate) || new Date().toISOString().split('T')[0],
      amount: Number(sp.amount) || 0,
      payment_method: sp.paymentMethod || 'Cash',
      reference_number: sp.referenceNumber || null,
      notes: sp.notes || null,
      recorded_by: sp.recordedBy || 'Admin',
    };
  },
  supplierPaymentFromDb(row: any, suppliersMap?: Map<string, string>): SupplierPayment {
    return {
      id: row.id,
      paymentNumber: row.payment_number,
      supplierId: row.supplier_id,
      supplierName: (suppliersMap && suppliersMap.get(row.supplier_id)) || row.supplier_name || 'Supplier',
      paymentDate: row.payment_date,
      amount: Number(row.amount) || 0,
      paymentMethod: row.payment_method || 'Cash',
      referenceNumber: row.reference_number || '',
      notes: row.notes || '',
      recordedBy: row.recorded_by,
    };
  },

  // PURCHASES
  purchaseToDb(p: Purchase) {
    return {
      id: ensureUUID(p.id, '50000001'),
      invoice_number: p.invoiceNumber,
      supplier_id: ensureUUID(p.supplierId, '40000001'),
      purchase_date: sanitizeDate(p.purchaseDate) || new Date().toISOString().split('T')[0],
      subtotal: Number(p.subtotal) || 0,
      discount: Number(p.discount) || 0,
      additional_charges: Number(p.additionalCharges) || 0,
      grand_total: Number(p.grandTotal) || 0,
      amount_paid: Number(p.amountPaid) || 0,
      remaining_payable: Number(p.remainingPayable) || 0,
      payment_method: p.paymentMethod || 'Cash',
      status: p.status || 'Draft',
      notes: p.notes || null,
      created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    };
  },
  purchaseFromDb(row: any, items: PurchaseItem[] = [], suppliersMap?: Map<string, string>): Purchase {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      supplierId: row.supplier_id,
      supplierName: (suppliersMap && suppliersMap.get(row.supplier_id)) || row.supplier_name || 'Supplier',
      purchaseDate: row.purchase_date,
      subtotal: Number(row.subtotal) || 0,
      discount: Number(row.discount) || 0,
      additionalCharges: Number(row.additional_charges) || 0,
      grandTotal: Number(row.grand_total) || 0,
      amountPaid: Number(row.amount_paid) || 0,
      remainingPayable: Number(row.remaining_payable) || 0,
      paymentMethod: row.payment_method || 'Cash',
      status: row.status,
      notes: row.notes || '',
      createdAt: row.created_at ? row.created_at.split('T')[0] : '',
      items,
    };
  },

  purchaseItemToDb(item: PurchaseItem, purchaseId: string) {
    return {
      id: ensureUUID(item.id, '51000001'),
      purchase_id: ensureUUID(purchaseId, '50000001'),
      product_id: ensureUUID(item.productId, '30000001'),
      category: item.category,
      batch_number: item.batchNumber || 'BATCH-001',
      expiry_date: sanitizeDate(item.expiryDate),
      unit: item.unit || 'Piece',
      quantity: Number(item.quantity) || 0,
      purchase_price: Number(item.purchasePrice) || 0,
      discount: Number(item.discount) || 0,
      line_total: Number(item.lineTotal) || 0,
    };
  },
  purchaseItemFromDb(row: any, productsMap?: Map<string, any>): PurchaseItem {
    const prod = productsMap ? productsMap.get(row.product_id) : null;
    return {
      id: row.id,
      productId: row.product_id,
      productName: prod?.name || row.product_name || 'Product',
      sku: prod?.sku || row.sku || '',
      category: row.category || 'Cold Drinks',
      batchNumber: row.batch_number || '',
      expiryDate: row.expiry_date || '',
      unit: row.unit || 'Piece',
      quantity: Number(row.quantity) || 0,
      purchasePrice: Number(row.purchase_price) || 0,
      discount: Number(row.discount) || 0,
      lineTotal: Number(row.line_total) || 0,
    };
  },

  // ORDERS
  orderToDb(o: Order) {
    return {
      id: ensureUUID(o.id, '60000001'),
      order_number: o.orderNumber,
      client_id: ensureUUID(o.clientId, '20000001'),
      area: o.area || '',
      party_category: o.partyCategory || 'B',
      salesperson: o.salesperson || 'Admin',
      order_date: sanitizeDate(o.orderDate) || new Date().toISOString().split('T')[0],
      delivery_date: sanitizeDate(o.deliveryDate),
      subtotal: Number(o.subtotal) || 0,
      discount_total: Number(o.discountTotal) || 0,
      tax_amount: Number(o.taxAmount) || 0,
      grand_total: Number(o.grandTotal) || 0,
      amount_paid: Number(o.amountPaid) || 0,
      amount_remaining: Number(o.amountRemaining) || 0,
      status: o.status || 'Posted',
      payment_method: o.paymentMethod || 'Cash',
      payment_status: o.paymentStatus || 'Unpaid',
      notes: o.notes || null,
      created_at: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
    };
  },
  orderFromDb(row: any, items: OrderItem[] = [], clientsMap?: Map<string, any>): Order {
    const clt = clientsMap ? clientsMap.get(row.client_id) : null;
    return {
      id: row.id,
      orderNumber: row.order_number,
      clientId: row.client_id,
      clientName: clt?.name || row.client_name || 'Client',
      companyName: clt?.companyName || row.company_name || 'Shop',
      area: row.area,
      partyCategory: row.party_category || 'B',
      salesperson: row.salesperson,
      orderDate: row.order_date,
      deliveryDate: row.delivery_date || '',
      subtotal: Number(row.subtotal) || 0,
      discountTotal: Number(row.discount_total) || 0,
      taxAmount: Number(row.tax_amount) || 0,
      grandTotal: Number(row.grand_total) || 0,
      amountPaid: Number(row.amount_paid) || 0,
      amountRemaining: Number(row.amount_remaining) || 0,
      status: row.status,
      paymentMethod: row.payment_method || 'Cash',
      paymentStatus: row.payment_status || 'Unpaid',
      notes: row.notes || '',
      createdAt: row.created_at ? row.created_at.split('T')[0] : '',
      items,
    };
  },

  orderItemToDb(item: OrderItem, orderId: string) {
    return {
      id: ensureUUID(item.id, '61000001'),
      order_id: ensureUUID(orderId, '60000001'),
      product_id: ensureUUID(item.productId, '30000001'),
      category: item.category || 'Cold Drinks',
      batch: item.batch || null,
      unit: item.unit || 'Piece',
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unitPrice) || 0,
      discount_percent: Number(item.discountPercent) || 0,
      discount_amount: Number(item.discountAmount) || 0,
      total: Number(item.total) || 0,
    };
  },
  orderItemFromDb(row: any, productsMap?: Map<string, any>): OrderItem {
    const prod = productsMap ? productsMap.get(row.product_id) : null;
    return {
      id: row.id,
      productId: row.product_id,
      productName: prod?.name || row.product_name || 'Product',
      sku: prod?.sku || row.sku || '',
      category: row.category || 'Cold Drinks',
      batch: row.batch || '',
      unit: row.unit || 'Piece',
      quantity: Number(row.quantity) || 0,
      availableStock: prod?.availableStock || 0,
      unitPrice: Number(row.unit_price) || 0,
      discountPercent: Number(row.discount_percent) || 0,
      discountAmount: Number(row.discount_amount) || 0,
      total: Number(row.total) || 0,
    };
  },

  // PAYMENTS (Customer collections)
  paymentToDb(pay: Payment) {
    return {
      id: ensureUUID(pay.id, '70000001'),
      payment_number: pay.paymentNumber,
      client_id: ensureUUID(pay.clientId, '20000001'),
      payment_date: sanitizeDate(pay.paymentDate) || new Date().toISOString().split('T')[0],
      amount: Number(pay.amount) || 0,
      payment_method: pay.paymentMethod || 'Cash',
      reference_number: pay.referenceNumber || null,
      allocated_invoice: pay.allocatedInvoice || null,
      notes: pay.notes || null,
      recorded_by: pay.recordedBy || 'Admin',
      status: pay.status || 'Completed',
    };
  },
  paymentFromDb(row: any, clientsMap?: Map<string, any>): Payment {
    const clt = clientsMap ? clientsMap.get(row.client_id) : null;
    return {
      id: row.id,
      paymentNumber: row.payment_number,
      clientId: row.client_id,
      clientName: clt?.name || row.client_name || 'Client',
      companyName: clt?.companyName || row.company_name || 'Shop',
      area: clt?.area || '',
      paymentDate: row.payment_date,
      amount: Number(row.amount) || 0,
      paymentMethod: row.payment_method || 'Cash',
      referenceNumber: row.reference_number || '',
      allocatedInvoice: row.allocated_invoice || '',
      notes: row.notes || '',
      recordedBy: row.recorded_by,
      status: row.status || 'Completed',
    };
  },

  // CLIENT LEDGER
  ledgerToDb(l: LedgerEntry) {
    return {
      id: ensureUUID(l.id, '75000001'),
      client_id: ensureUUID(l.clientId, '20000001'),
      date: sanitizeDate(l.date) || new Date().toISOString().split('T')[0],
      reference: l.reference,
      type: l.type,
      description: l.description,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      balance: Number(l.balance) || 0,
      notes: l.notes || null,
    };
  },
  ledgerFromDb(row: any): LedgerEntry {
    return {
      id: row.id,
      clientId: row.client_id,
      date: row.date,
      reference: row.reference,
      type: row.type,
      description: row.description,
      debit: Number(row.debit) || 0,
      credit: Number(row.credit) || 0,
      balance: Number(row.balance) || 0,
      notes: row.notes || '',
    };
  },

  // EXPENSES
  expenseToDb(e: Expense) {
    return {
      id: ensureUUID(e.id, '80000001'),
      expense_number: e.expenseNumber,
      date: sanitizeDate(e.date) || new Date().toISOString().split('T')[0],
      category: e.category,
      description: e.description,
      amount: Number(e.amount) || 0,
      payment_method: e.paymentMethod || 'Cash',
      paid_to: e.paidTo || 'Vendor',
      notes: e.notes || null,
      status: e.status || 'Posted',
      recorded_by: e.recordedBy || 'Admin',
    };
  },
  expenseFromDb(row: any): Expense {
    return {
      id: row.id,
      expenseNumber: row.expense_number,
      date: row.date,
      category: row.category,
      description: row.description,
      amount: Number(row.amount) || 0,
      paymentMethod: row.payment_method || 'Cash',
      paidTo: row.paid_to,
      receiptReference: row.receipt_reference || '',
      notes: row.notes || '',
      status: row.status || 'Posted',
      recordedBy: row.recorded_by,
    };
  },

  // INVENTORY TRANSACTIONS
  inventoryTxToDb(tx: InventoryTransaction) {
    return {
      id: ensureUUID(tx.id, '85000001'),
      date: sanitizeDate(tx.date) || new Date().toISOString().split('T')[0],
      reference: tx.reference,
      product_id: ensureUUID(tx.productId, '30000001'),
      type: tx.type,
      quantity: Number(tx.quantity) || 0,
      unit: tx.unit || null,
      previous_stock: Number(tx.previousStock) || 0,
      new_stock: Number(tx.newStock) || 0,
      unit_cost: Number(tx.unitCost) || 0,
      total_cost: Number(tx.totalCost) || 0,
      performed_by: tx.user || 'Admin',
      notes: tx.notes || null,
      supplier: tx.supplier || null,
      warehouse: tx.warehouse || null,
    };
  },
  inventoryTxFromDb(row: any, productsMap?: Map<string, any>): InventoryTransaction {
    const prod = productsMap ? productsMap.get(row.product_id) : null;
    return {
      id: row.id,
      date: row.date,
      reference: row.reference,
      productId: row.product_id,
      productName: prod?.name || row.product_name || 'Product',
      sku: prod?.sku || row.sku || '',
      category: prod?.category || row.category || 'Cold Drinks',
      type: row.type,
      quantity: Number(row.quantity) || 0,
      unit: row.unit || '',
      previousStock: Number(row.previous_stock) || 0,
      newStock: Number(row.new_stock) || 0,
      unitCost: Number(row.unit_cost) || 0,
      totalCost: Number(row.total_cost) || 0,
      user: row.performed_by || 'Admin',
      notes: row.notes || '',
      supplier: row.supplier || '',
      warehouse: row.warehouse || '',
    };
  },

  // DAILY CLOSINGS
  dailyClosingToDb(dc: DailyClosing) {
    return {
      id: ensureUUID(dc.id, '90000001'),
      date: sanitizeDate(dc.date) || new Date().toISOString().split('T')[0],
      status: dc.status || 'OPEN',
      closed_at: sanitizeTimestamptz(dc.closedAt),
      closed_by: dc.closedBy || null,
      reopened_at: sanitizeTimestamptz(dc.reopenedAt),
      reopened_by: dc.reopenedBy || null,
      reopen_reason: dc.reopenReason || null,
      notes: dc.notes || null,
    };
  },
  dailyClosingFromDb(row: any, items: DailyClosingItem[] = []): DailyClosing {
    return {
      id: row.id,
      date: row.date,
      status: row.status,
      closedAt: row.closed_at || undefined,
      closedBy: row.closed_by || undefined,
      reopenedAt: row.reopened_at || undefined,
      reopenedBy: row.reopened_by || undefined,
      reopenReason: row.reopen_reason || undefined,
      notes: row.notes || '',
      items,
    };
  },

  dailyClosingItemToDb(item: DailyClosingItem, closingId: string) {
    return {
      id: ensureUUID((item as any).id, '91000001'),
      closing_id: ensureUUID(closingId, '90000001'),
      product_id: ensureUUID(item.productId, '30000001'),
      opening_stock: Number(item.openingStock) || 0,
      purchases: Number(item.purchases) || 0,
      sales_returns: Number(item.salesReturns) || 0,
      other_increases: Number(item.otherIncreases) || 0,
      sales: Number(item.sales) || 0,
      purchase_returns: Number(item.purchaseReturns) || 0,
      expired: Number(item.expired) || 0,
      damaged: Number(item.damaged) || 0,
      other_decreases: Number(item.otherDecreases) || 0,
      expected_closing: Number(item.expectedClosing) || 0,
      physical_count: Number(item.physicalCount) || 0,
      variance: Number(item.variance) || 0,
      reason: item.reason || null,
    };
  },
  dailyClosingItemFromDb(row: any, productsMap?: Map<string, any>): DailyClosingItem {
    const prod = productsMap ? productsMap.get(row.product_id) : null;
    return {
      productId: row.product_id,
      productName: prod?.name || row.product_name || 'Product',
      category: prod?.category || row.category || 'Cold Drinks',
      unit: prod?.unit || row.unit || 'Piece',
      openingStock: Number(row.opening_stock) || 0,
      purchases: Number(row.purchases) || 0,
      salesReturns: Number(row.sales_returns) || 0,
      otherIncreases: Number(row.other_increases) || 0,
      sales: Number(row.sales) || 0,
      purchaseReturns: Number(row.purchase_returns) || 0,
      expired: Number(row.expired) || 0,
      damaged: Number(row.damaged) || 0,
      otherDecreases: Number(row.other_decreases) || 0,
      expectedClosing: Number(row.expected_closing) || 0,
      physicalCount: Number(row.physical_count) || 0,
      variance: Number(row.variance) || 0,
      reason: row.reason || '',
    };
  },

  // BAD DEBTS
  badDebtToDb(bd: BadDebt) {
    return {
      id: ensureUUID(bd.id, '92000001'),
      bad_debt_number: bd.badDebtNumber,
      client_id: ensureUUID(bd.clientId, '20000001'),
      order_id: isValidUUID(bd.orderId) ? bd.orderId : null,
      outstanding_amount: Number(bd.outstandingAmount) || 0,
      write_off_amount: Number(bd.writeOffAmount) || 0,
      reason: bd.reason,
      status: bd.status || 'Pending',
      requested_by: bd.requestedBy || 'Admin',
      approved_by: bd.approvedBy || null,
      approval_date: sanitizeTimestamptz(bd.approvalDate),
      notes: bd.notes || null,
    };
  },
  badDebtFromDb(row: any, clientsMap?: Map<string, any>): BadDebt {
    const clt = clientsMap ? clientsMap.get(row.client_id) : null;
    return {
      id: row.id,
      badDebtNumber: row.bad_debt_number,
      clientId: row.client_id,
      clientName: clt?.name || row.client_name || 'Client',
      orderId: row.order_id || undefined,
      outstandingAmount: Number(row.outstanding_amount) || 0,
      writeOffAmount: Number(row.write_off_amount) || 0,
      reason: row.reason,
      status: row.status,
      date: row.created_at ? row.created_at.split('T')[0] : '',
      requestedBy: row.requested_by,
      approvedBy: row.approved_by || undefined,
      approvalDate: row.approval_date || undefined,
      notes: row.notes || '',
    };
  },

  // BAD DEBT RECOVERIES
  badDebtRecoveryToDb(bdr: BadDebtRecovery) {
    return {
      id: ensureUUID(bdr.id, '93000001'),
      recovery_number: bdr.recoveryNumber,
      bad_debt_id: ensureUUID(bdr.badDebtId, '92000001'),
      client_id: ensureUUID(bdr.clientId, '20000001'),
      amount: Number(bdr.amount) || 0,
      payment_date: sanitizeDate(bdr.date) || new Date().toISOString().split('T')[0],
      payment_method: bdr.paymentMethod || 'Cash',
      notes: bdr.notes || null,
      recorded_by: bdr.recordedBy || 'Admin',
    };
  },
  badDebtRecoveryFromDb(row: any, clientsMap?: Map<string, any>): BadDebtRecovery {
    const clt = clientsMap ? clientsMap.get(row.client_id) : null;
    return {
      id: row.id,
      recoveryNumber: row.recovery_number,
      badDebtId: row.bad_debt_id,
      clientId: row.client_id,
      clientName: clt?.name || row.client_name || 'Client',
      amount: Number(row.amount) || 0,
      date: row.payment_date || (row.created_at ? row.created_at.split('T')[0] : ''),
      paymentMethod: row.payment_method || 'Cash',
      notes: row.notes || '',
      recordedBy: row.recorded_by,
    };
  },

  // DAMAGED STOCK
  damagedStockToDb(d: DamagedStockRecord) {
    return {
      id: ensureUUID(d.id, '94000001'),
      product_id: ensureUUID(d.productId, '30000001'),
      batch: d.batch || null,
      quantity: Number(d.quantity) || 0,
      unit: d.unit || 'Piece',
      unit_cost: Number(d.unitCost) || 0,
      total_loss: Number(d.totalLoss) || 0,
      date: sanitizeDate(d.date) || new Date().toISOString().split('T')[0],
      reason: d.reason,
      recorded_by: d.recordedBy || 'Admin',
      approved_by: d.approvedBy || null,
    };
  },
  damagedStockFromDb(row: any, productsMap?: Map<string, any>): DamagedStockRecord {
    const prod = productsMap ? productsMap.get(row.product_id) : null;
    return {
      id: row.id,
      productId: row.product_id,
      productName: prod?.name || row.product_name || 'Product',
      category: prod?.category || row.category || 'Cold Drinks',
      batch: row.batch || '',
      quantity: Number(row.quantity) || 0,
      unit: row.unit || 'Piece',
      unitCost: Number(row.unit_cost) || 0,
      totalLoss: Number(row.total_loss) || 0,
      date: row.date,
      reason: row.reason,
      recordedBy: row.recorded_by,
      approvedBy: row.approved_by || undefined,
    };
  },

  // EXPIRY RECORDS
  expiryRecordToDb(ex: ExpiryRecord) {
    return {
      id: ensureUUID(ex.id, '95000001'),
      product_id: ensureUUID(ex.productId, '30000001'),
      batch: ex.batch || 'BATCH-001',
      manufacturing_date: sanitizeDate(ex.manufacturingDate),
      expiry_date: sanitizeDate(ex.expiryDate) || new Date().toISOString().split('T')[0],
      quantity: Number(ex.quantity) || 0,
      unit: ex.unit || 'Piece',
      purchase_cost: Number(ex.purchaseCost) || 0,
      status: ex.status || 'Safe',
      written_off_at: sanitizeTimestamptz(ex.writtenOffAt),
      reason: ex.reason || null,
      approved_by: ex.approvedBy || null,
    };
  },
  expiryRecordFromDb(row: any, productsMap?: Map<string, any>): ExpiryRecord {
    const prod = productsMap ? productsMap.get(row.product_id) : null;
    return {
      id: row.id,
      productId: row.product_id,
      productName: prod?.name || row.product_name || 'Product',
      category: prod?.category || row.category || 'Cold Drinks',
      batch: row.batch,
      manufacturingDate: row.manufacturing_date || '',
      expiryDate: row.expiry_date,
      quantity: Number(row.quantity) || 0,
      unit: row.unit,
      purchaseCost: Number(row.purchase_cost) || 0,
      status: row.status,
      writtenOffAt: row.written_off_at || undefined,
      reason: row.reason || '',
      approvedBy: row.approved_by || undefined,
    };
  },

  // STAFF PROFILES
  staffToDb(s: Staff) {
    return {
      id: ensureUUID(s.id, '00000001'),
      employee_id: s.employeeId,
      name: s.name,
      email: s.email,
      phone: s.phone || null,
      role: s.role || 'Admin',
      department: s.department || 'Management',
      joining_date: sanitizeDate(s.joiningDate) || new Date().toISOString().split('T')[0],
      status: s.status || 'Active',
      avatar_url: s.avatarUrl || null,
    };
  },
  staffFromDb(row: any): Staff {
    return {
      id: row.id,
      employeeId: row.employee_id,
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      role: row.role || 'Admin',
      department: row.department,
      joiningDate: row.joining_date,
      status: row.status,
      avatarUrl: row.avatar_url || undefined,
    };
  },

  // AUDIT LOGS
  auditLogToDb(a: AuditLog) {
    return {
      id: ensureUUID(a.id, '99000001'),
      timestamp: sanitizeTimestamptz(a.timestamp) || new Date().toISOString(),
      user_name: a.user || 'Admin',
      action: a.action,
      module: a.module,
      record_ref: a.recordRef,
      details: a.details,
    };
  },
  auditLogFromDb(row: any): AuditLog {
    return {
      id: row.id,
      timestamp: row.timestamp || '',
      user: row.user_name,
      action: row.action,
      module: row.module,
      recordRef: row.record_ref,
      details: row.details,
    };
  },

  // PURCHASE RETURNS
  purchaseReturnToDb(pr: PurchaseReturn) {
    return {
      id: ensureUUID(pr.id, '52000001'),
      return_number: pr.returnNumber,
      purchase_id: ensureUUID(pr.purchaseId, '50000001'),
      supplier_id: ensureUUID(pr.supplierId, '40000001'),
      product_id: ensureUUID(pr.productId, '30000001'),
      quantity: Number(pr.quantity) || 0,
      unit: pr.unit || 'Piece',
      batch: pr.batch || null,
      return_date: sanitizeDate(pr.returnDate) || new Date().toISOString().split('T')[0],
      refund_amount: Number(pr.refundAmount) || 0,
      reason: pr.reason,
      status: pr.status || 'Completed',
    };
  },
  purchaseReturnFromDb(
    row: any,
    suppliersMap?: Map<string, string>,
    productsMap?: Map<string, any>,
    purchasesMap?: Map<string, any>
  ): PurchaseReturn {
    const prod = productsMap ? productsMap.get(row.product_id) : null;
    const pur = purchasesMap ? purchasesMap.get(row.purchase_id) : null;
    return {
      id: row.id,
      returnNumber: row.return_number,
      purchaseId: row.purchase_id,
      purchaseInvoiceNumber: pur?.invoiceNumber || row.purchase_invoice_number || 'PINV',
      supplierId: row.supplier_id,
      supplierName: (suppliersMap && suppliersMap.get(row.supplier_id)) || row.supplier_name || 'Supplier',
      productId: row.product_id,
      productName: prod?.name || row.product_name || 'Product',
      quantity: Number(row.quantity) || 0,
      unit: row.unit,
      batch: row.batch || '',
      returnDate: row.return_date,
      refundAmount: Number(row.refund_amount) || 0,
      reason: row.reason,
      status: row.status,
    };
  },

  // SALES RETURNS
  salesReturnToDb(sr: SalesReturn) {
    return {
      id: ensureUUID(sr.id, '62000001'),
      return_number: sr.returnNumber,
      order_id: ensureUUID(sr.orderId, '60000001'),
      client_id: ensureUUID(sr.clientId, '20000001'),
      product_id: ensureUUID(sr.productId, '30000001'),
      quantity: Number(sr.quantity) || 0,
      unit: sr.unit || 'Piece',
      batch: sr.batch || null,
      return_date: sanitizeDate(sr.returnDate) || new Date().toISOString().split('T')[0],
      refund_amount: Number(sr.refundAmount) || 0,
      is_resalable: sr.isResalable !== false,
      reason: sr.reason,
      status: sr.status || 'Completed',
    };
  },
  salesReturnFromDb(
    row: any,
    clientsMap?: Map<string, any>,
    productsMap?: Map<string, any>,
    ordersMap?: Map<string, any>
  ): SalesReturn {
    const clt = clientsMap ? clientsMap.get(row.client_id) : null;
    const prod = productsMap ? productsMap.get(row.product_id) : null;
    const ord = ordersMap ? ordersMap.get(row.order_id) : null;
    return {
      id: row.id,
      returnNumber: row.return_number,
      orderId: row.order_id,
      orderNumber: ord?.orderNumber || row.order_number || 'INV',
      clientId: row.client_id,
      clientName: clt?.name || row.client_name || 'Client',
      productId: row.product_id,
      productName: prod?.name || row.product_name || 'Product',
      quantity: Number(row.quantity) || 0,
      unit: row.unit,
      batch: row.batch || '',
      returnDate: row.return_date,
      refundAmount: Number(row.refund_amount) || 0,
      isResalable: row.is_resalable !== false,
      reason: row.reason,
      status: row.status,
    };
  },
};
