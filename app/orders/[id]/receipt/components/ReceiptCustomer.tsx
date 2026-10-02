import React from 'react';

export function ReceiptCustomer({
  customerName,
  phone,
  email,
  address,
}: {
  customerName: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  return (
    <div className="mb-4 text-sm text-gray-800">
      <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Customer:</p>
      <p className="font-semibold">{customerName}</p>
      {phone && <p>{phone}</p>}
      {email && <p>{email}</p>}
      {address && <p>{address}</p>}
      <div className="border-b border-dashed border-gray-400 my-4"></div>
    </div>
  );
}
