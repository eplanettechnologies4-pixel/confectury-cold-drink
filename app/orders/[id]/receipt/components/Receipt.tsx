import React from 'react';
import { Order } from '@/types';
import { ReceiptHeader } from './ReceiptHeader';
import { ReceiptCustomer } from './ReceiptCustomer';
import { ReceiptItems } from './ReceiptItems';
import { ReceiptTotals } from './ReceiptTotals';
import { ReceiptPayment } from './ReceiptPayment';
import { ReceiptFooter } from './ReceiptFooter';

// A unique receipt number generator based on order date/id (mocked for now, normally stored in DB)
const generateReceiptNumber = (orderId: string) => {
  return `EP-${orderId.substring(0, 6).toUpperCase()}`;
};

export function Receipt({ order }: { order: Order }) {
  const receiptNumber = generateReceiptNumber(order.id);

  return (
    <div className="bg-white p-6 max-w-sm mx-auto shadow-sm border border-gray-200 receipt-content print:shadow-none print:border-none print:p-0 print:m-0 font-mono text-gray-900">
      <ReceiptHeader 
        receiptNumber={receiptNumber}
        orderNumber={order.orderNumber}
        date={order.orderDate}
        time={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      />
      
      <ReceiptCustomer 
        customerName={order.clientName}
        // In a real scenario, these would come from order.client details which might need a join
        // Here we just show what we have
      />
      
      <ReceiptItems items={order.items} />
      
      <ReceiptTotals 
        subtotal={order.subtotal}
        discount={order.discountTotal}
        tax={order.taxAmount}
        grandTotal={order.grandTotal}
        paid={order.amountPaid}
        remaining={order.amountRemaining}
      />
      
      <ReceiptPayment 
        paymentMethod={order.paymentMethod}
        paymentStatus={order.paymentStatus}
      />
      
      <ReceiptFooter />
    </div>
  );
}
