import { NextResponse } from 'next/server';
import { getServiceClient, mappers, ensureUUID } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Supabase credentials not configured in .env.local',
      });
    }

    // Parallel fetch of all primary tables
    const [
      areasRes,
      clientsRes,
      productsRes,
      suppliersRes,
      supplierPaymentsRes,
      purchasesRes,
      purchaseItemsRes,
      ordersRes,
      orderItemsRes,
      paymentsRes,
      ledgerRes,
      expensesRes,
      stockTxRes,
      dailyClosingsRes,
      dailyClosingItemsRes,
      badDebtsRes,
      badDebtRecoveriesRes,
      damagedStockRes,
      expiryRecordsRes,
      staffRes,
      auditLogsRes,
      purchaseReturnsRes,
      salesReturnsRes,
    ] = await Promise.all([
      supabase.from('areas').select('*').order('code', { ascending: true }),
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('name', { ascending: true }),
      supabase.from('suppliers').select('*').order('name', { ascending: true }),
      supabase.from('supplier_payments').select('*').order('payment_date', { ascending: false }),
      supabase.from('purchases').select('*').order('created_at', { ascending: false }),
      supabase.from('purchase_items').select('*'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('order_items').select('*'),
      supabase.from('payments').select('*').order('payment_date', { ascending: false }),
      supabase.from('client_ledger').select('*').order('date', { ascending: true }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('daily_closings').select('*').order('date', { ascending: false }),
      supabase.from('daily_closing_items').select('*'),
      supabase.from('bad_debts').select('*').order('created_at', { ascending: false }),
      supabase.from('bad_debt_recoveries').select('*').order('payment_date', { ascending: false }),
      supabase.from('damaged_stock').select('*').order('date', { ascending: false }),
      supabase.from('expiry_records').select('*').order('expiry_date', { ascending: true }),
      supabase.from('staff_profiles').select('*').order('name', { ascending: true }),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
      supabase.from('purchase_returns').select('*').order('created_at', { ascending: false }),
      supabase.from('sales_returns').select('*').order('created_at', { ascending: false }),
    ]);

    const areas = (areasRes.data || []).map(mappers.areaFromDb);
    const clients = (clientsRes.data || []).map(mappers.clientFromDb);
    const products = (productsRes.data || []).map(mappers.productFromDb);
    const suppliers = (suppliersRes.data || []).map(mappers.supplierFromDb);

    // Create lookup maps
    const clientsMap = new Map(clients.map(c => [c.id, c]));
    const productsMap = new Map(products.map(p => [p.id, p]));
    const suppliersMap = new Map(suppliers.map(s => [s.id, s.name]));

    // Group items for purchases
    const purchaseItemsByPurchaseId = new Map<string, any[]>();
    (purchaseItemsRes.data || []).forEach((item: any) => {
      const list = purchaseItemsByPurchaseId.get(item.purchase_id) || [];
      list.push(mappers.purchaseItemFromDb(item, productsMap));
      purchaseItemsByPurchaseId.set(item.purchase_id, list);
    });

    // Group items for orders
    const orderItemsByOrderId = new Map<string, any[]>();
    (orderItemsRes.data || []).forEach((item: any) => {
      const list = orderItemsByOrderId.get(item.order_id) || [];
      list.push(mappers.orderItemFromDb(item, productsMap));
      orderItemsByOrderId.set(item.order_id, list);
    });

    // Group items for daily closings
    const closingItemsByClosingId = new Map<string, any[]>();
    (dailyClosingItemsRes.data || []).forEach((item: any) => {
      const list = closingItemsByClosingId.get(item.closing_id) || [];
      list.push(mappers.dailyClosingItemFromDb(item, productsMap));
      closingItemsByClosingId.set(item.closing_id, list);
    });

    // Group client ledger by client_id
    const ledgerByClient: Record<string, any[]> = {};
    (ledgerRes.data || []).forEach((row: any) => {
      const entry = mappers.ledgerFromDb(row);
      if (!ledgerByClient[entry.clientId]) ledgerByClient[entry.clientId] = [];
      ledgerByClient[entry.clientId].push(entry);
    });

    const supplierPayments = (supplierPaymentsRes.data || []).map(row =>
      mappers.supplierPaymentFromDb(row, suppliersMap)
    );

    const purchases = (purchasesRes.data || []).map((p: any) =>
      mappers.purchaseFromDb(p, purchaseItemsByPurchaseId.get(p.id) || [], suppliersMap)
    );
    const purchasesMap = new Map(purchases.map(p => [p.id, p]));

    const orders = (ordersRes.data || []).map((o: any) =>
      mappers.orderFromDb(o, orderItemsByOrderId.get(o.id) || [], clientsMap)
    );
    const ordersMap = new Map(orders.map(o => [o.id, o]));

    const payments = (paymentsRes.data || []).map(row => mappers.paymentFromDb(row, clientsMap));
    const expenses = (expensesRes.data || []).map(mappers.expenseFromDb);
    const inventoryTransactions = (stockTxRes.data || []).map(row =>
      mappers.inventoryTxFromDb(row, productsMap)
    );
    const dailyClosings = (dailyClosingsRes.data || []).map((dc: any) =>
      mappers.dailyClosingFromDb(dc, closingItemsByClosingId.get(dc.id) || [])
    );
    const badDebts = (badDebtsRes.data || []).map(row => mappers.badDebtFromDb(row, clientsMap));
    const badDebtRecoveries = (badDebtRecoveriesRes.data || []).map(row =>
      mappers.badDebtRecoveryFromDb(row, clientsMap)
    );
    const damagedStockRecords = (damagedStockRes.data || []).map(row =>
      mappers.damagedStockFromDb(row, productsMap)
    );
    const expiryRecords = (expiryRecordsRes.data || []).map(row =>
      mappers.expiryRecordFromDb(row, productsMap)
    );
    const staff = (staffRes.data || []).map(mappers.staffFromDb);
    const auditLogs = (auditLogsRes.data || []).map(mappers.auditLogFromDb);
    const purchaseReturns = (purchaseReturnsRes.data || []).map(row =>
      mappers.purchaseReturnFromDb(row, suppliersMap, productsMap, purchasesMap)
    );
    const salesReturns = (salesReturnsRes.data || []).map(row =>
      mappers.salesReturnFromDb(row, clientsMap, productsMap, ordersMap)
    );

    const hasAnyData =
      areas.length > 0 ||
      clients.length > 0 ||
      products.length > 0 ||
      suppliers.length > 0 ||
      orders.length > 0;

    return NextResponse.json({
      success: true,
      configured: true,
      hasData: hasAnyData,
      data: {
        areas,
        clients,
        products,
        suppliers,
        supplierPayments,
        purchases,
        purchaseReturns,
        orders,
        salesReturns,
        payments,
        ledgerEntries: ledgerByClient,
        inventoryTransactions,
        expenses,
        dailyClosings,
        badDebts,
        badDebtRecoveries,
        damagedStockRecords,
        expiryRecords,
        staff,
        auditLogs,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/supabase/data:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Error fetching data from Supabase' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Supabase credentials not configured in .env.local',
      });
    }

    const payload = await req.json();
    const { action, entity, data, id } = payload;

    if (!entity || !action) {
      return NextResponse.json({ success: false, message: 'Missing entity or action' }, { status: 400 });
    }

    if (action === 'delete') {
      const targetId = ensureUUID(id || data?.id);
      const table = getTableName(entity);
      const { error } = await supabase.from(table).delete().eq('id', targetId);
      if (error) throw error;
      return NextResponse.json({ success: true, deletedId: targetId });
    }

    if (action === 'upsert') {
      switch (entity) {
        case 'product': {
          const row = mappers.productToDb(data);
          const { error } = await supabase.from('products').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'client': {
          const row = mappers.clientToDb(data);
          const { error } = await supabase.from('clients').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'area': {
          const row = mappers.areaToDb(data);
          const { error } = await supabase.from('areas').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'supplier': {
          const row = mappers.supplierToDb(data);
          const { error } = await supabase.from('suppliers').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'supplier_payment': {
          const row = mappers.supplierPaymentToDb(data);
          const { error } = await supabase.from('supplier_payments').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'purchase': {
          const purchaseRow = mappers.purchaseToDb(data);
          const { error: pErr } = await supabase.from('purchases').upsert(purchaseRow);
          if (pErr) throw pErr;

          if (Array.isArray(data.items) && data.items.length > 0) {
            const itemRows = data.items.map((it: any) => mappers.purchaseItemToDb(it, purchaseRow.id));
            const { error: itemsErr } = await supabase.from('purchase_items').upsert(itemRows);
            if (itemsErr) throw itemsErr;
          }
          return NextResponse.json({ success: true, id: purchaseRow.id });
        }

        case 'order': {
          const orderRow = mappers.orderToDb(data);
          const { error: oErr } = await supabase.from('orders').upsert(orderRow);
          if (oErr) throw oErr;

          if (Array.isArray(data.items) && data.items.length > 0) {
            const itemRows = data.items.map((it: any) => mappers.orderItemToDb(it, orderRow.id));
            const { error: itemsErr } = await supabase.from('order_items').upsert(itemRows);
            if (itemsErr) throw itemsErr;
          }
          return NextResponse.json({ success: true, id: orderRow.id });
        }

        case 'payment': {
          const row = mappers.paymentToDb(data);
          const { error } = await supabase.from('payments').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'ledger': {
          const row = mappers.ledgerToDb(data);
          const { error } = await supabase.from('client_ledger').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'expense': {
          const row = mappers.expenseToDb(data);
          const { error } = await supabase.from('expenses').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'inventory_tx': {
          const row = mappers.inventoryTxToDb(data);
          const { error } = await supabase.from('inventory_transactions').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'daily_closing': {
          const closingRow = mappers.dailyClosingToDb(data);
          const { error: cErr } = await supabase.from('daily_closings').upsert(closingRow);
          if (cErr) throw cErr;

          if (Array.isArray(data.items) && data.items.length > 0) {
            const itemRows = data.items.map((it: any) => mappers.dailyClosingItemToDb(it, closingRow.id));
            const { error: itemsErr } = await supabase.from('daily_closing_items').upsert(itemRows);
            if (itemsErr) throw itemsErr;
          }
          return NextResponse.json({ success: true, id: closingRow.id });
        }

        case 'bad_debt': {
          const row = mappers.badDebtToDb(data);
          const { error } = await supabase.from('bad_debts').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'bad_debt_recovery': {
          const row = mappers.badDebtRecoveryToDb(data);
          const { error } = await supabase.from('bad_debt_recoveries').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'damaged_stock': {
          const row = mappers.damagedStockToDb(data);
          const { error } = await supabase.from('damaged_stock').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'expiry_record': {
          const row = mappers.expiryRecordToDb(data);
          const { error } = await supabase.from('expiry_records').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'staff': {
          const row = mappers.staffToDb(data);
          const { error } = await supabase.from('staff_profiles').upsert(row, { onConflict: 'email' });
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'audit_log': {
          const row = mappers.auditLogToDb(data);
          const { error } = await supabase.from('audit_logs').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'purchase_return': {
          const row = mappers.purchaseReturnToDb(data);
          const { error } = await supabase.from('purchase_returns').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'sales_return': {
          const row = mappers.salesReturnToDb(data);
          const { error } = await supabase.from('sales_returns').upsert(row);
          if (error) throw error;
          return NextResponse.json({ success: true, id: row.id });
        }

        default:
          return NextResponse.json({ success: false, message: `Unknown entity: ${entity}` }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Error in POST /api/supabase/data:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Error writing data to Supabase' },
      { status: 500 }
    );
  }
}

function getTableName(entity: string): string {
  switch (entity) {
    case 'product':
      return 'products';
    case 'client':
      return 'clients';
    case 'area':
      return 'areas';
    case 'supplier':
      return 'suppliers';
    case 'supplier_payment':
      return 'supplier_payments';
    case 'purchase':
      return 'purchases';
    case 'order':
      return 'orders';
    case 'payment':
      return 'payments';
    case 'ledger':
      return 'client_ledger';
    case 'expense':
      return 'expenses';
    case 'inventory_tx':
      return 'inventory_transactions';
    case 'daily_closing':
      return 'daily_closings';
    case 'bad_debt':
      return 'bad_debts';
    case 'bad_debt_recovery':
      return 'bad_debt_recoveries';
    case 'damaged_stock':
      return 'damaged_stock';
    case 'expiry_record':
      return 'expiry_records';
    case 'staff':
      return 'staff_profiles';
    case 'audit_log':
      return 'audit_logs';
    case 'purchase_return':
      return 'purchase_returns';
    case 'sales_return':
      return 'sales_returns';
    default:
      return entity;
  }
}
