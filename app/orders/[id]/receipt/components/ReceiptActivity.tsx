import React from 'react';
import { ReceiptLog } from '@/types';

export function ReceiptActivity({ logs }: { logs: ReceiptLog[] }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6 print:hidden max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Receipt Activity</h3>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col sm:flex-row sm:justify-between text-sm">
            <div>
              <p className="font-semibold text-gray-800">
                Receipt {log.action.toLowerCase()}
              </p>
              {log.email && (
                <a href={`mailto: ${log.email}`} className="text-blue-600 hover:underline">
                  {log.email}
                </a>
              )}
            </div>
            <div className="text-gray-500 mt-1 sm:mt-0 text-right">
              {new Date(log.sentAt).toLocaleString([], {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
