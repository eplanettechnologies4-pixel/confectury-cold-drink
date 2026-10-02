export type StaffRole = 'Admin' | 'Manager' | 'Sales' | 'Accounts' | 'Inventory' | 'Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  avatarUrl?: string;
  department: string;
}

export interface Staff {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  avatarUrl?: string;
}

export type CustomerType = 'Wholesaler' | 'Supermarket' | 'Retailer' | 'Hotel/Restaurant' | 'Distributor';
export type PartyCategory = 'A' | 'B' | 'C';
export type PaymentTerms = 'Cash' | '7 Days' | '15 Days' | '30 Days' | '45 Days' | 'Custom';

export interface Area {
  id: string;
  code: string;
  name: string;
  description?: string;
  assignedSalesperson?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface ClientAddress {
  address: string;
  city: string;
  area: string;
  postalCode: string;
}

export interface Client {
  id: string;
  clientId: string; // e.g. CLT-1001
  name: string; // Owner / contact person
  companyName: string; // Shop / business name
  clientType: CustomerType;
  partyCategory: PartyCategory; // A (High), B (Medium), C (Low)
  phone: string;
  contactPerson?: string;
  alternatePhone?: string;
  email?: string;
  taxId?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  address: ClientAddress;
  areaId?: string;
  area: string;
  salesRep: string;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  openingBalance: number;
  balanceType: 'Receivable' | 'Payable';
  totalPurchases: number;
  totalPaid: number;
  currentBalance: number; // positive = customer owes us (Receivable)
  lastTransactionDate: string;
  notes?: string;
  createdAt: string;
}

export type TransactionType =
  | 'Invoice'
  | 'Credit Sale'
  | 'Cash Sale'
  | 'Payment Received'
  | 'Sales Return'
  | 'Credit Note'
  | 'Debit Note'
  | 'Opening Balance'
  | 'Authorized Adjustment'
  | 'Bad Debt Write-off'
  | 'Bad Debt Recovery'
  | 'Refund'
  | 'Reversal';

export interface LedgerEntry {
  id: string;
  clientId: string;
  date: string;
  reference: string; // e.g. INV-1001 or PAY-2001
  type: TransactionType;
  description: string;
  debit: number;  // Increases receivable balance
  credit: number; // Decreases receivable balance
  balance: number; // Running balance after transaction
  notes?: string;
}

// Strictly Confectionery & Cold Drinks
export type ProductCategory = 'Confectionery' | 'Cold Drinks';

export type ProductPackagingUnit =
  | 'Piece'
  | 'Box'
  | 'Pack'
  | 'Carton'
  | 'Bottle'
  | 'Crate'
  | 'Case (24)'
  | 'Pack (12)'
  | 'Box (36)'
  | string;

export interface Product {
  id: string;
  sku: string; // e.g. DRK-CC-330
  barcode: string;
  name: string;
  category: ProductCategory;
  brand: string;
  unit: ProductPackagingUnit;
  purchaseUnit?: string;
  salesUnit?: string;
  unitsPerCarton?: number;
  unitsPerPack?: number;
  costPrice: number; // Purchase price
  sellingPrice: number; // Wholesale selling price
  openingStock?: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStockLevel: number; // Reorder level
  supplier: string;
  supplierId?: string;
  description: string;
  imageUrl?: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  isActive: boolean;
}

export type StockMovementType =
  | 'Stock In'
  | 'Stock Out'
  | 'Sale'
  | 'Adjustment'
  | 'Return'
  | 'Damaged'
  | 'Expired'
  | 'PURCHASE'
  | 'SALE'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'EXPIRY_WRITE_OFF'
  | 'DAMAGE_WRITE_OFF'
  | 'STOCK_ADJUSTMENT'
  | 'OPENING_STOCK'
  | 'REVERSAL';

export interface InventoryTransaction {
  id: string;
  date: string;
  reference: string;
  productId: string;
  productName: string;
  sku: string;
  category?: ProductCategory;
  batch?: string;
  type: StockMovementType;
  quantity: number; // positive for addition, negative for deduction
  unit?: string;
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  user: string;
  notes?: string;
  supplier?: string;
  warehouse?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category?: ProductCategory;
  batch?: string;
  unit: string;
  quantity: number;
  availableStock: number;
  unitPrice: number;
  price?: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
}

export type OrderStatus = 'Draft' | 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled' | 'Posted' | 'Reversed';

export interface Order {
  id: string;
  orderNumber: string; // e.g. INV-8801
  clientId: string;
  clientName: string;
  companyName: string;
  area: string;
  partyCategory?: PartyCategory;
  salesperson: string;
  orderDate: string;
  date?: string;
  deliveryDate?: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  discount?: number;
  taxAmount: number;
  grandTotal: number;
  total?: number;
  amountPaid: number; // Cash received
  paidAmount?: number;
  amountRemaining: number; // Credit amount
  remainingAmount?: number;
  status: OrderStatus;
  paymentMethod: 'Cash' | 'Credit Account' | 'Bank Transfer' | 'Cheque' | 'Partial Cash/Credit' | 'Credit' | 'Bank';
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
  notes?: string;
  createdAt?: string;
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Other' | 'Bank';

export interface Payment {
  id: string;
  paymentNumber: string; // Receipt number
  clientId: string;
  clientName: string;
  companyName?: string;
  area?: string;
  paymentDate: string;
  date?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  method?: PaymentMethod;
  referenceNumber: string;
  reference?: string;
  allocatedInvoice?: string;
  orderId?: string;
  notes?: string;
  recordedBy: string;
  status: 'Completed' | 'Pending' | 'Bounced' | 'Received';
}

export interface Supplier {
  id: string;
  supplierId: string; // e.g. SUP-101
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  openingPayable: number;
  currentPayable: number;
  paymentTerms: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string; // e.g. SPAY-201
  supplierId: string;
  supplierName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  allocatedPurchase?: string;
  notes?: string;
  recordedBy: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  batchNumber: string;
  expiryDate?: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  discount: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string; // e.g. PINV-501
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  additionalCharges: number;
  grandTotal: number;
  total?: number;
  amountPaid: number;
  remainingPayable: number;
  paymentMethod: 'Cash' | 'Credit' | 'Partial';
  paymentStatus?: 'Paid' | 'Partially Paid' | 'Unpaid';
  status: 'Draft' | 'Posted' | 'Cancelled';
  notes?: string;
  createdAt: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  purchaseId: string;
  purchaseInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  batch?: string;
  returnDate: string;
  refundAmount: number;
  reason: string;
  status: 'Completed' | 'Pending';
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  batch?: string;
  returnDate: string;
  date?: string;
  refundAmount: number;
  isResalable: boolean; // If resalable -> goes to stock; if not -> damaged loss
  condition?: string;
  reason: string;
  status: 'Completed' | 'Pending';
}

export type ClosingStatus = 'OPEN' | 'RECONCILIATION' | 'CLOSED';

export interface DailyClosingItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  unit: string;
  openingStock: number;
  purchases: number;
  salesReturns: number;
  otherIncreases: number;
  sales: number;
  purchaseReturns: number;
  expired: number;
  damaged: number;
  otherDecreases: number;
  expectedClosing: number;
  physicalCount: number;
  variance: number;
  reason?: string;
}

export interface DailyClosing {
  id: string;
  date: string; // YYYY-MM-DD
  status: ClosingStatus;
  items: DailyClosingItem[];
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Fuel'
  | 'Vehicle Maintenance'
  | 'Loading'
  | 'Unloading'
  | 'Labour'
  | 'Salaries'
  | 'Warehouse'
  | 'Electricity'
  | 'Rent'
  | 'Telephone'
  | 'Internet'
  | 'Delivery'
  | 'Transport'
  | 'Vehicle Repair'
  | 'Damaged Goods Handling'
  | 'Other';

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: ExpenseCategory | string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidTo: string;
  area?: string;
  receiptReference?: string;
  reference?: string;
  notes?: string;
  status: 'Draft' | 'Posted';
  recordedBy: string;
}

export interface BadDebt {
  id: string;
  badDebtNumber: string;
  clientId: string;
  clientName: string;
  orderId?: string;
  invoiceReference?: string;
  invoiceNumber?: string;
  outstandingAmount: number;
  writeOffAmount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date?: string;
  requestedBy: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

export interface BadDebtRecovery {
  id: string;
  recoveryNumber: string;
  badDebtId: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedBy: string;
}

export interface ExpiryRecord {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  batch: string;
  manufacturingDate?: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  purchaseCost: number;
  status: 'Safe' | 'Expiring Soon' | 'Expired' | 'Written Off' | 'Returned to Supplier';
  writtenOffAt?: string;
  reason?: string;
  approvedBy?: string;
}

export interface DamagedStockRecord {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  batch: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalLoss: number;
  date: string;
  reason: string;
  recordedBy: string;
  approvedBy?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module:
    | 'Clients'
    | 'Inventory'
    | 'Orders'
    | 'Sales'
    | 'Purchases'
    | 'Accounts'
    | 'Finance'
    | 'Expenses'
    | 'Staff'
    | 'System'
    | 'Closing';
  recordRef: string;
  details: string;
}

export interface DashboardKPIs {
  totalClients: number;
  totalClientsTrend: number;
  totalReceivables: number;
  inventoryValue: number;
  todaySales: number;
  todayPurchases: number;
  todayCollections: number;
  todayExpenses: number;
  todayProfit: number;
  pendingPayments: number;
  lowStockItemsCount: number;
  expiredCount: number;
  expiringSoonCount: number;
}

export type ReceiptAction = 'PRINTED' | 'EMAILED';

export interface ReceiptLog {
  id: string;
  orderId: string;
  receiptNumber: string;
  action: ReceiptAction;
  email?: string;
  sentAt: string;
  sentBy: string;
  createdAt: string;
}
