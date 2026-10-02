import React from 'react';
import { BUSINESS_CONFIG } from '@/lib/utils';

export function ReceiptFooter() {
  return (
    <div className="text-center text-xs text-gray-700 mt-6 mb-2 space-y-1">
      <p className="font-semibold text-gray-800">Thank you for your business with {BUSINESS_CONFIG.name}!</p>
      <p className="text-[10px] text-gray-500">Khuram Chowk, Tezab Mills Road, Faisalabad</p>
      <p className="text-[10px] text-gray-500">Contact: {BUSINESS_CONFIG.phone1} • {BUSINESS_CONFIG.phone2}</p>
    </div>
  );
}
