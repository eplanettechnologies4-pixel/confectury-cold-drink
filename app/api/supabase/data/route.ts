import { NextResponse } from 'next/server';
import { getServiceClient, mappers, ensureUUID } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

async function fetchAllRows(
  supabase: any,
  table: string,
  orderBy?: { column: string; ascending?: boolean }
): Promise<any[]> {
  const CHUNK_SIZE = 1000;
  let allRows: any[] = [];
  let from = 0;
  while (true) {
    let query = supabase.from(table).select('*');
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }
    query = query.range(from, from + CHUNK_SIZE - 1);
    const { data, error } = await query;
    if (error) {
      console.error(`[fetchAllRows] Error fetching ${table} rows [${from}-${from + CHUNK_SIZE - 1}]:`, error);
      break;
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < CHUNK_SIZE) break;
    from += CHUNK_SIZE;
  }
  return allRows;
}

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

    // Parallel fetch of all primary tables with pagination to bypass PostgREST 1000-row limit
    const [
      areasRows,
      clientsRows,
      productsRows,
      suppliersRows,
      supplierPaymentsRows,
      purchasesRows,
      purchaseItemsRows,
      ordersRows,
      orderItemsRows,
      paymentsRows,
      ledgerRows,
      expensesRows,
      stockTxRows,
      dailyClosingsRows,
      dailyClosingItemsRows,
      badDebtsRows,
      badDebtRecoveriesRows,
      damagedStockRows,
      expiryRecordsRows,
      staffRows,
      auditLogsRes,
      purchaseReturnsRows,
      salesReturnsRows,
    ] = await Promise.all([
      fetchAllRows(supabase, 'areas', { column: 'code', ascending: true }),
      fetchAllRows(supabase, 'clients', { column: 'created_at', ascending: false }),
      fetchAllRows(supabase, 'products', { column: 'name', ascending: true }),
      fetchAllRows(supabase, 'suppliers', { column: 'name', ascending: true }),
      fetchAllRows(supabase, 'supplier_payments', { column: 'payment_date', ascending: false }),
      fetchAllRows(supabase, 'purchases', { column: 'created_at', ascending: false }),
      fetchAllRows(supabase, 'purchase_items'),
      fetchAllRows(supabase, 'orders', { column: 'created_at', ascending: false }),
      fetchAllRows(supabase, 'order_items'),
      fetchAllRows(supabase, 'payments', { column: 'payment_date', ascending: false }),
      fetchAllRows(supabase, 'client_ledger', { column: 'date', ascending: true }),
      fetchAllRows(supabase, 'expenses', { column: 'date', ascending: false }),
      fetchAllRows(supabase, 'inventory_transactions', { column: 'created_at', ascending: false }),
      fetchAllRows(supabase, 'daily_closings', { column: 'date', ascending: false }),
      fetchAllRows(supabase, 'daily_closing_items'),
      fetchAllRows(supabase, 'bad_debts', { column: 'created_at', ascending: false }),
      fetchAllRows(supabase, 'bad_debt_recoveries', { column: 'payment_date', ascending: false }),
      fetchAllRows(supabase, 'damaged_stock', { column: 'date', ascending: false }),
      fetchAllRows(supabase, 'expiry_records', { column: 'expiry_date', ascending: true }),
      fetchAllRows(supabase, 'staff_profiles', { column: 'name', ascending: true }),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
      fetchAllRows(supabase, 'purchase_returns', { column: 'created_at', ascending: false }),
      fetchAllRows(supabase, 'sales_returns', { column: 'created_at', ascending: false }),
    ]);

    const areas = areasRows.map(mappers.areaFromDb);
    const clients = clientsRows.map(mappers.clientFromDb);
    const products = productsRows.map(mappers.productFromDb);
    const suppliers = suppliersRows.map(mappers.supplierFromDb);

    // Create lookup maps
    const clientsMap = new Map(clients.map(c => [c.id, c]));
    const productsMap = new Map(products.map(p => [p.id, p]));
    const suppliersMap = new Map(suppliers.map(s => [s.id, s.name]));

    // Group items for purchases
    const purchaseItemsByPurchaseId = new Map<string, any[]>();
    purchaseItemsRows.forEach((item: any) => {
      const list = purchaseItemsByPurchaseId.get(item.purchase_id) || [];
      list.push(mappers.purchaseItemFromDb(item, productsMap));
      purchaseItemsByPurchaseId.set(item.purchase_id, list);
    });

    // Group items for orders
    const orderItemsByOrderId = new Map<string, any[]>();
    orderItemsRows.forEach((item: any) => {
      const list = orderItemsByOrderId.get(item.order_id) || [];
      list.push(mappers.orderItemFromDb(item, productsMap));
      orderItemsByOrderId.set(item.order_id, list);
    });

    // Group items for daily closings
    const closingItemsByClosingId = new Map<string, any[]>();
    dailyClosingItemsRows.forEach((item: any) => {
      const list = closingItemsByClosingId.get(item.closing_id) || [];
      list.push(mappers.dailyClosingItemFromDb(item, productsMap));
      closingItemsByClosingId.set(item.closing_id, list);
    });

    // Group client ledger by client_id
    const ledgerByClient: Record<string, any[]> = {};
    ledgerRows.forEach((row: any) => {
      const entry = mappers.ledgerFromDb(row);
      if (!ledgerByClient[entry.clientId]) ledgerByClient[entry.clientId] = [];
      ledgerByClient[entry.clientId].push(entry);
    });

    const supplierPayments = supplierPaymentsRows.map(row =>
      mappers.supplierPaymentFromDb(row, suppliersMap)
    );

    // Identify returned purchases and sales orders
    const returnedPurchaseIds = new Set<string>(
      purchaseReturnsRows
        .map((pr: any) => pr.purchase_id)
        .filter(Boolean)
    );
    const returnedOrderIds = new Set<string>(
      salesReturnsRows
        .map((sr: any) => sr.order_id)
        .filter(Boolean)
    );

    const purchases = purchasesRows.map((p: any) => {
      const pur = mappers.purchaseFromDb(p, purchaseItemsByPurchaseId.get(p.id) || [], suppliersMap);
      if (returnedPurchaseIds.has(p.id) || p.status === 'Cancelled' || (typeof p.notes === 'string' && p.notes.includes('[RETURNED]'))) {
        pur.status = 'Returned';
      }
      return pur;
    });
    const purchasesMap = new Map(purchases.map(p => [p.id, p]));

    // Inventory transactions by reference as fallback for any legacy order missing items
    const txsByOrderNumber = new Map<string, any[]>();
    stockTxRows.forEach((tx: any) => {
      if (tx.reference && tx.type === 'SALE') {
        const list = txsByOrderNumber.get(tx.reference) || [];
        list.push(tx);
        txsByOrderNumber.set(tx.reference, list);
      }
    });

    const orders = ordersRows.map((o: any) => {
      let items = orderItemsByOrderId.get(o.id) || [];
      // Safety Fallback: if order_items was empty, reconstruct items from inventory_transactions
      if (items.length === 0 && txsByOrderNumber.has(o.order_number)) {
        const txs = txsByOrderNumber.get(o.order_number)!;
        items = txs.map((tx: any, idx: number) => {
          const prod = productsMap.get(tx.product_id);
          const qty = Math.abs(Number(tx.quantity) || 1);
          const unitPrice = prod?.sellingPrice || Number(tx.unit_cost) || 0;
          return {
            id: tx.id || `${o.id}-item-${idx}`,
            productId: tx.product_id,
            productName: prod?.name || 'Product',
            sku: prod?.sku || '',
            category: prod?.category || 'Confectionery',
            unit: tx.unit || prod?.unit || 'Piece',
            quantity: qty,
            availableStock: prod?.currentStock || 0,
            unitPrice,
            discountPercent: 0,
            discountAmount: 0,
            total: unitPrice * qty,
          };
        });
      }
      const ord = mappers.orderFromDb(o, items, clientsMap);
      if (returnedOrderIds.has(o.id) || o.status === 'Cancelled' || (typeof o.notes === 'string' && o.notes.includes('[RETURNED]'))) {
        ord.status = 'Returned';
      }
      return ord;
    });
    const ordersMap = new Map(orders.map(o => [o.id, o]));

    const payments = paymentsRows.map(row => mappers.paymentFromDb(row, clientsMap));
    const expenses = expensesRows.map(mappers.expenseFromDb);
    const inventoryTransactions = stockTxRows.map(row =>
      mappers.inventoryTxFromDb(row, productsMap)
    );
    const dailyClosings = dailyClosingsRows.map((dc: any) =>
      mappers.dailyClosingFromDb(dc, closingItemsByClosingId.get(dc.id) || [])
    );
    const badDebts = badDebtsRows.map(row => mappers.badDebtFromDb(row, clientsMap));
    const badDebtRecoveries = badDebtRecoveriesRows.map(row =>
      mappers.badDebtRecoveryFromDb(row, clientsMap)
    );
    const damagedStockRecords = (damagedStockRows || []).map(row =>
      mappers.damagedStockFromDb(row, productsMap)
    );
    const expiryRecords = expiryRecordsRows.map(row =>
      mappers.expiryRecordFromDb(row, productsMap)
    );
    const staff = staffRows.map(mappers.staffFromDb);
    const auditLogs = (auditLogsRes.data || []).map(mappers.auditLogFromDb);
    const purchaseReturns = purchaseReturnsRows.map(row =>
      mappers.purchaseReturnFromDb(row, suppliersMap, productsMap, purchasesMap)
    );
    const salesReturns = salesReturnsRows.map(row =>
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

      if (entity === 'product') {
        // Cascade delete child records referencing this product
        await supabase.from('sales_returns').delete().eq('product_id', targetId);
        await supabase.from('purchase_returns').delete().eq('product_id', targetId);
        await supabase.from('order_items').delete().eq('product_id', targetId);
        await supabase.from('purchase_items').delete().eq('product_id', targetId);
        await supabase.from('damaged_stock').delete().eq('product_id', targetId);
        await supabase.from('expiry_records').delete().eq('product_id', targetId);
        await supabase.from('daily_closing_items').delete().eq('product_id', targetId);
        await supabase.from('inventory_transactions').delete().eq('product_id', targetId);

        const { error } = await supabase.from('products').delete().eq('id', targetId);
        if (error) throw error;
        return NextResponse.json({ success: true, deletedId: targetId });
      }

      if (entity === 'order') {
        await supabase.from('sales_returns').delete().eq('order_id', targetId);
        await supabase.from('order_items').delete().eq('order_id', targetId);
        const { error } = await supabase.from('orders').delete().eq('id', targetId);
        if (error) throw error;
        return NextResponse.json({ success: true, deletedId: targetId });
      }

      if (entity === 'purchase') {
        await supabase.from('purchase_returns').delete().eq('purchase_id', targetId);
        await supabase.from('purchase_items').delete().eq('purchase_id', targetId);
        const { error } = await supabase.from('purchases').delete().eq('id', targetId);
        if (error) throw error;
        return NextResponse.json({ success: true, deletedId: targetId });
      }

      if (entity === 'client') {
        await supabase.from('client_ledger').delete().eq('client_id', targetId);
        await supabase.from('payments').delete().eq('client_id', targetId);
        await supabase.from('bad_debt_recoveries').delete().eq('client_id', targetId);
        await supabase.from('bad_debts').delete().eq('client_id', targetId);
        await supabase.from('sales_returns').delete().eq('client_id', targetId);
        const { data: clientOrders } = await supabase.from('orders').select('id').eq('client_id', targetId);
        if (clientOrders && clientOrders.length > 0) {
          const oIds = clientOrders.map((o: any) => o.id);
          await supabase.from('order_items').delete().in('order_id', oIds);
          await supabase.from('orders').delete().eq('client_id', targetId);
        }
        const { error } = await supabase.from('clients').delete().eq('id', targetId);
        if (error) throw error;
        return NextResponse.json({ success: true, deletedId: targetId });
      }

      if (entity === 'supplier') {
        // 1. Delete purchase returns referencing this supplier directly
        await supabase.from('purchase_returns').delete().eq('supplier_id', targetId);
        // 2. Delete supplier payments
        await supabase.from('supplier_payments').delete().eq('supplier_id', targetId);
        // 3. Find purchases from this supplier
        const { data: suppPurchases } = await supabase.from('purchases').select('id').eq('supplier_id', targetId);
        if (suppPurchases && suppPurchases.length > 0) {
          const pIds = suppPurchases.map((p: any) => p.id);
          // Delete purchase returns referencing these purchases
          await supabase.from('purchase_returns').delete().in('purchase_id', pIds);
          // Delete purchase items for these purchases
          await supabase.from('purchase_items').delete().in('purchase_id', pIds);
          // Delete the purchases
          await supabase.from('purchases').delete().eq('supplier_id', targetId);
        }
        // 4. Nullify supplier_id on products referencing this supplier
        await supabase.from('products').update({ supplier_id: null }).eq('supplier_id', targetId);

        // 5. Delete supplier
        const { error } = await supabase.from('suppliers').delete().eq('id', targetId);
        if (error) throw error;
        return NextResponse.json({ success: true, deletedId: targetId });
      }

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
          const { error: pErr } = await supabase.from('purchases').upsert(purchaseRow, { onConflict: 'id' });
          if (pErr) throw pErr;

          if (Array.isArray(data.items) && data.items.length > 0) {
            await supabase.from('purchase_items').delete().eq('purchase_id', purchaseRow.id);
            const itemRows = data.items.map((it: any) => mappers.purchaseItemToDb(it, purchaseRow.id));
            const { error: itemsErr } = await supabase.from('purchase_items').insert(itemRows);
            if (itemsErr) throw itemsErr;
          }
          return NextResponse.json({ success: true, id: purchaseRow.id });
        }

        case 'order': {
          const orderRow = mappers.orderToDb(data);
          const { error: oErr } = await supabase.from('orders').upsert(orderRow, { onConflict: 'id' });
          if (oErr) throw oErr;

          if (Array.isArray(data.items) && data.items.length > 0) {
            await supabase.from('order_items').delete().eq('order_id', orderRow.id);
            const itemRows = data.items.map((it: any) => mappers.orderItemToDb(it, orderRow.id));
            const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);
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
          const { data: upsertedRows, error: cErr } = await supabase
            .from('daily_closings')
            .upsert(closingRow, { onConflict: 'date' })
            .select('id');
          if (cErr) throw cErr;

          const closingId = upsertedRows?.[0]?.id || closingRow.id;

          if (Array.isArray(data.items) && data.items.length > 0) {
            await supabase.from('daily_closing_items').delete().eq('closing_id', closingId);
            const { data: existingProds } = await supabase.from('products').select('id');
            const validProdIds = new Set((existingProds || []).map((p: any) => p.id));

            const itemRows = data.items
              .map((it: any) => mappers.dailyClosingItemToDb(it, closingId))
              .filter((row: any) => validProdIds.has(row.product_id));

            if (itemRows.length > 0) {
              const { error: itemsErr } = await supabase.from('daily_closing_items').insert(itemRows);
              if (itemsErr) throw itemsErr;
            }
          }
          return NextResponse.json({ success: true, id: closingId });
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
          if (row.purchase_id) {
            const { data: pur } = await supabase.from('purchases').select('notes').eq('id', row.purchase_id).maybeSingle();
            const curNotes = pur?.notes || '';
            const newNotes = (curNotes + (curNotes.includes('[RETURNED]') ? '' : ' [RETURNED]')).trim();
            await supabase.from('purchases').update({ status: 'Cancelled', notes: newNotes }).eq('id', row.purchase_id);
          }
          return NextResponse.json({ success: true, id: row.id });
        }

        case 'sales_return': {
          const row = mappers.salesReturnToDb(data);
          const { error } = await supabase.from('sales_returns').upsert(row);
          if (error) throw error;
          if (row.order_id) {
            const { data: ord } = await supabase.from('orders').select('notes').eq('id', row.order_id).maybeSingle();
            const curNotes = ord?.notes || '';
            const newNotes = (curNotes + (curNotes.includes('[RETURNED]') ? '' : ' [RETURNED]')).trim();
            await supabase.from('orders').update({ status: 'Cancelled', notes: newNotes }).eq('id', row.order_id);
          }
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
