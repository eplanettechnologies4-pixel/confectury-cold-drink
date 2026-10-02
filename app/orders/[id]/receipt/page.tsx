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
import { ReceiptLog } from '@/types';

export default function ReceiptPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { orders, clients } = useAppState();

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [receiptLogs, setReceiptLogs] = useState<ReceiptLog[]>([]);

  const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
  const client = clients.find(c => c.id === order?.clientId);

  if (!order) {
    return (
      <div className="p-8 text-center text-slate-500">
        Order record not found.
      </div>
    );
  }

  const handleEmailSuccess = (email: string) => {
    // Log the successful email
    const newLog: ReceiptLog = {
      id: Math.random().toString(36).substring(7),
      orderId: order.id,
      receiptNumber: `EP-${order.id.substring(0, 6).toUpperCase()}`,
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
            <p className="text-sm text-slate-500">Receipt #EP-{order.id.substring(0, 6).toUpperCase()}</p>
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
        <Receipt order={order} />
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
