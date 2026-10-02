import React from 'react';

export function ReceiptPayment({
  paymentMethod,
  paymentStatus,
}: {
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
}) {
  return (
    <div className="mb-4 text-center text-sm">
      <p className="mb-2 text-gray-600">Payment: {paymentMethod}</p>
      
      <div className={`inline-block border-2 px-4 py-1 font-bold text-lg uppercase ${
        paymentStatus === 'Paid' ? 'border-gray-800 text-gray-800' :
        paymentStatus === 'Partially Paid' ? 'border-gray-600 text-gray-600' :
        'border-gray-500 text-gray-500'
      }`}>
        {paymentStatus}
      </div>
      
      <div className="border-b border-dashed border-gray-400 mt-4 mb-4"></div>
    </div>
  );
}
