import React from 'react';
import { OrderItem } from '@/types';

export function ReceiptItems({ items }: { items: OrderItem[] }) {
  return (
    <div className="mb-4 text-sm text-gray-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dashed border-gray-400">
            <th className="text-left pb-2 font-semibold">Item</th>
            <th className="text-right pb-2 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id || index} className="align-top">
              <td className="py-2 pr-2">
                <div className="font-medium">{item.productName}</div>
                <div className="text-xs text-gray-500">
                  {item.quantity} &times; Rs. ${item.unitPrice.toFixed(2)}
                </div>
              </td>
              <td className="py-2 text-right font-medium">Rs. ${item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-b border-dashed border-gray-400 my-4"></div>
    </div>
  );
}
