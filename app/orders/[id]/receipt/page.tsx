'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { Receipt } from './components/Receipt';
import { PrintReceiptButton } from './components/PrintReceiptButton';
import { EmailReceiptModal } from './components/EmailReceiptModal';
import { ReceiptActivity } from './components/ReceiptActivity';
import { ReceiptLog, OrderItem } from '@/types';

export default function ReceiptPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { orders, clients, products, inventoryTransactions, supabaseSyncStatus } = useAppState();

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [receiptLogs, setReceiptLogs] = useState<ReceiptLog[]>([]);

  const rawOrder = orders.find(o => o.id === orderId || o.orderNumber === orderId);
  const client = clients.find(c => c.id === rawOrder?.clientId);

  const order = React.useMemo(() => {
    if (!rawOrder) return null;
    if (rawOrder.items && rawOrder.items.length > 0) return rawOrder;
    // Fallback: reconstruct items from inventoryTransactions if items array was missing
    const matchingTx = (inventoryTransactions || []).filter(
      tx => tx.reference === rawOrder.orderNumber && (tx.type === 'Sale' || (tx.type as string) === 'SALE' || tx.type === 'Stock Out')
    );
    if (matchingTx.length > 0) {
      const reconstructedItems: OrderItem[] = matchingTx.map((tx, idx): OrderItem => {
        const prod = products.find(p => p.id === tx.productId);
        const qty = Math.abs(tx.quantity);
        const unitPrice = prod?.sellingPrice || (rawOrder.grandTotal / (matchingTx.length || 1));
        return {
          id: tx.id || `reconstructed-${idx}`,
          productId: tx.productId,
          productName: prod?.name || (tx as any).productName || 'Wholesale Product',
          sku: prod?.sku || '',
          category: prod?.category || 'Confectionery',
          unit: tx.unit || prod?.unit || 'Piece',
          quantity: qty,
          returnedQuantity: 0,
          availableStock: prod?.currentStock || 0,
          unitPrice,
          discountPercent: 0,
          discountAmount: 0,
          total: unitPrice * qty,
        };
      });
      return { ...rawOrder, items: reconstructedItems };
    }
    return rawOrder;
  }, [rawOrder, inventoryTransactions, products]);

  if (!order) {
    if (supabaseSyncStatus === 'syncing') {
      return (
        <div className="p-12 text-center text-slate-500">
          <p className="text-base font-semibold animate-pulse">Loading receipt from Supabase...</p>
        </div>
      );
    }
    return (
      <div className="p-8 text-center text-slate-500">
        Order record not found.
      </div>
    );
  }

  const handleEmailSuccess = (email: string) => {
    // Log the successful email
    const newLog: ReceiptLog = {
      id: `log-${Date.now()}-${receiptLogs.length}`,
      orderId: order.id,
      receiptNumber: order.orderNumber,
      action: 'EMAILED',
      email,
      sentAt: new Date().toISOString(),
      sentBy: 'Current User', // In real app, from auth session
      createdAt: new Date().toISOString(),
    };
    
    setReceiptLogs(prev => [newLog, ...prev]);
    setIsEmailModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Action Header - Screen Only */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3">
          <Link href={`/orders/${orderId}`} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Order {order.orderNumber}</h1>
            <p className="text-sm text-slate-500">Receipt #{order.orderNumber}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <PrintReceiptButton />
          
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors"
          >
            <span className="text-xl">✉</span>
            <span className="font-semibold">Email Receipt</span>
          </button>
        </div>
      </div>

      {/* Centered Receipt Area */}
      <div className="mt-8">
        <Receipt order={order} client={client} />
      </div>

      {/* Activity Logs */}
      <ReceiptActivity logs={receiptLogs} />

      {/* Email Modal */}
      <EmailReceiptModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        orderId={order.id}
        defaultEmail={client?.email || ''}
        onSuccess={handleEmailSuccess}
      />
    </div>
  );
}
