import React from 'react';

type BadgeType = 
  | 'In Stock' | 'Low Stock' | 'Out of Stock'
  | 'Draft' | 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled'
  | 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue'
  | 'Active' | 'Inactive' | 'Suspended'
  | 'Admin' | 'Manager' | 'Sales' | 'Accounts' | 'Inventory' | 'Staff'
  | 'Stock In' | 'Stock Out' | 'Sale' | 'Adjustment' | 'Return' | 'Damaged' | 'Expired';

interface StatusBadgeProps {
  status: BadgeType | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';
  
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    // Inventory / General Status
    case 'In Stock':
    case 'Active':
    case 'Delivered':
    case 'Paid':
    case 'Completed':
    case 'Stock In':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;

    case 'Low Stock':
    case 'Pending':
    case 'Partially Paid':
    case 'Adjustment':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
      break;

    case 'Out of Stock':
    case 'Cancelled':
    case 'Unpaid':
    case 'Overdue':
    case 'Inactive':
    case 'Suspended':
    case 'Damaged':
    case 'Expired':
    case 'Stock Out':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
      break;

    case 'Draft':
    case 'Sale':
    case 'Return':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200/80';
      break;

    // Roles
    case 'Admin':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'Manager':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Sales':
      colorClasses = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      break;
    case 'Accounts':
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
      break;
    case 'Inventory':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    default:
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 mr-1.5"></span>
      {status}
    </span>
  );
};
