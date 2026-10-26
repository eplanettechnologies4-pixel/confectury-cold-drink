'use client';

import React from 'react';
import { Order, Client } from '@/types';
import { useAppState } from '@/lib/store';
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

export function Receipt({ order, client: propClient }: { order: Order; client?: Client | null }) {
  const { clients } = useAppState();
  const receiptNumber = generateReceiptNumber(order.id);

  // Look up client if not passed directly
  const client = propClient !== undefined ? propClient : (
    clients.find(c => c.id === order.clientId) ||
    clients.find(c => (order.companyName && c.companyName === order.companyName) || (order.clientName && c.name === order.clientName))
  );

  // Extract customer name & shop name
  const customerName = order.clientName || client?.name || order.companyName || client?.companyName || 'Valued Customer';
  const companyName = order.companyName || client?.companyName || '';

  // Extract phone number (priority: client record, snapshot on order, alternate phone)
  const phone = client?.phone || (order as any).clientPhone || client?.alternatePhone || '';

  // Format customer address (priority: snapshot on order, client address object/string, order/client area)
  const formatCustomerAddress = () => {
    if ((order as any).clientAddress) {
      return (order as any).clientAddress;
    }
    if (client?.address) {
      const clientAddr: any = client.address;
      if (typeof clientAddr === 'object') {
        const parts = [
          clientAddr.address,
          clientAddr.area || client.area || order.area,
          clientAddr.city || 'Faisalabad',
        ].filter(Boolean);
        // Deduplicate overlapping components
        const filteredParts: string[] = [];
        for (const part of parts) {
          if (!filteredParts.some(p => p.toLowerCase().includes(part.toLowerCase()) || part.toLowerCase().includes(p.toLowerCase()))) {
            filteredParts.push(part);
          } else if (filteredParts.length === 0) {
            filteredParts.push(part);
          }
        }
        return filteredParts.join(', ');
      }
      if (typeof clientAddr === 'string' && clientAddr.trim()) {
        const addr = clientAddr.trim();
        const area = client.area || order.area;
        if (area && !addr.toLowerCase().includes(area.toLowerCase())) {
          return `${addr}, ${area}`;
        }
        return addr;
      }
    }
    if (order.area) {
      return `${order.area}, Faisalabad`;
    }
    if (client?.area) {
      return `${client.area}, Faisalabad`;
    }
    return '';
  };

  const address = formatCustomerAddress();

  return (
    <div className="bg-white p-6 max-w-sm mx-auto shadow-sm border border-gray-200 receipt-content print:shadow-none print:border-none print:p-0 print:m-0 font-mono text-gray-900">
      <ReceiptHeader 
        receiptNumber={receiptNumber}
        orderNumber={order.orderNumber}
        date={order.orderDate}
        time={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      />
      
      <ReceiptCustomer 
        customerName={customerName}
        companyName={companyName}
        phone={phone}
        address={address}
        area={order.area || client?.area}
        email={client?.email}
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

