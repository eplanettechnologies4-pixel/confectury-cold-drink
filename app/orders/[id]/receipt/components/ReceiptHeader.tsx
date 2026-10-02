import React from 'react';
import { BUSINESS_CONFIG } from '@/lib/utils';

export function ReceiptHeader({
  receiptNumber,
  orderNumber,
  date,
  time,
}: {
  receiptNumber: string;
  orderNumber: string;
  date: string;
  time: string;
}) {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-black text-gray-900 tracking-tight">{BUSINESS_CONFIG.name}</h1>
      <p className="text-xs text-gray-700 font-bold uppercase tracking-wider">{BUSINESS_CONFIG.subtitle}</p>
      <p className="text-[11px] text-gray-500 mt-1">{BUSINESS_CONFIG.address}</p>
      <p className="text-[11px] text-gray-600 font-mono font-semibold">Ph: {BUSINESS_CONFIG.phone1} / {BUSINESS_CONFIG.phone2}</p>
      
      <div className="mt-4 text-left text-xs text-gray-700 font-mono space-y-1 bg-gray-50 p-2.5 rounded border border-gray-200">
        <p className="flex justify-between">
          <span className="font-sans text-gray-500">Receipt #:</span> <span className="font-bold text-gray-900">{receiptNumber}</span>
        </p>
        <p className="flex justify-between">
          <span className="font-sans text-gray-500">Invoice Ref #:</span> <span className="font-bold text-gray-900">{orderNumber}</span>
        </p>
        <p className="flex justify-between">
          <span className="font-sans text-gray-500">Date:</span> <span>{date}</span>
        </p>
        <p className="flex justify-between">
          <span className="font-sans text-gray-500">Time (PKT):</span> <span>{time}</span>
        </p>
      </div>
      
      <div className="border-b border-dashed border-gray-400 my-4"></div>
    </div>
  );
}
