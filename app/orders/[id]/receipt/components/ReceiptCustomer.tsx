import React from 'react';

export function ReceiptCustomer({
  customerName,
  companyName,
  phone,
  email,
  address,
  area,
}: {
  customerName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  area?: string;
}) {
  const displayName = customerName || companyName || 'Valued Customer';
  const showDistinctCompany = Boolean(
    companyName &&
    companyName.trim() &&
    displayName.trim().toLowerCase() !== companyName.trim().toLowerCase()
  );

  return (
    <div className="mb-4 text-xs text-gray-800 font-mono">
      <p className="text-gray-500 text-[11px] uppercase font-bold tracking-wider mb-2">CUSTOMER:</p>
      
      <div className="space-y-1.5">
        <div className="flex justify-between items-start gap-2">
          <span className="font-sans text-gray-500 text-[11px] shrink-0">Name:</span>
          <span className="font-bold text-gray-900 text-right flex-1 pl-2 break-words">{displayName}</span>
        </div>

        {showDistinctCompany && (
          <div className="flex justify-between items-start gap-2">
            <span className="font-sans text-gray-500 text-[11px] shrink-0">Shop/Business:</span>
            <span className="font-semibold text-gray-900 text-right flex-1 pl-2 break-words">{companyName}</span>
          </div>
        )}

        <div className="flex justify-between items-start gap-2">
          <span className="font-sans text-gray-500 text-[11px] shrink-0">Number:</span>
          <span className="font-bold text-gray-900 text-right flex-1 pl-2 font-mono">{phone || 'N/A'}</span>
        </div>

        <div className="flex justify-between items-start gap-2">
          <span className="font-sans text-gray-500 text-[11px] shrink-0">Address:</span>
          <span className="text-gray-900 text-right break-words flex-1 pl-2">
            {address || (area ? `${area}, Faisalabad` : 'N/A')}
          </span>
        </div>

        {email && (
          <div className="flex justify-between items-start gap-2">
            <span className="font-sans text-gray-500 text-[11px] shrink-0">Email:</span>
            <span className="text-gray-800 text-right flex-1 pl-2 break-all">{email}</span>
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-gray-400 my-4"></div>
    </div>
  );
}

