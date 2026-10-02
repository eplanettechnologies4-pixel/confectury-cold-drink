'use client';
import React from 'react';

export function PrintReceiptButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center justify-center space-x-2 w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-lg transition-colors print:hidden"
    >
      <span className="text-xl">🖨</span>
      <span className="font-semibold">Print Receipt</span>
    </button>
  );
}
