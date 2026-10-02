import React from 'react';

export function ReceiptTotals({
  subtotal,
  discount,
  tax,
  grandTotal,
  paid,
  remaining,
}: {
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paid: number;
  remaining: number;
}) {
  return (
    <div className="mb-4 text-sm text-gray-800">
      <div className="space-y-1">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>Rs. {subtotal.toFixed(2)}</span>
        </p>
        {discount > 0 && (
          <p className="flex justify-between">
            <span>Discount</span>
            <span>-Rs. {discount.toFixed(2)}</span>
          </p>
        )}
        <p className="flex justify-between">
          <span>Tax</span>
          <span>Rs. {tax.toFixed(2)}</span>
        </p>
      </div>
      
      <div className="border-b border-dashed border-gray-400 my-2"></div>
      
      <p className="flex justify-between text-base font-bold my-3">
        <span>TOTAL</span>
        <span>Rs. {grandTotal.toFixed(2)}</span>
      </p>
      
      <div className="space-y-1 mt-2">
        <p className="flex justify-between">
          <span>Paid</span>
          <span>Rs. {paid.toFixed(2)}</span>
        </p>
        <p className="flex justify-between font-semibold">
          <span>Remaining</span>
          <span>Rs. {remaining.toFixed(2)}</span>
        </p>
      </div>
      
      <div className="border-b border-dashed border-gray-400 my-4"></div>
    </div>
  );
}
