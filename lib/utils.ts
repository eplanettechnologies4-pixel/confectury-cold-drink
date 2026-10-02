import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Product } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BUSINESS_CONFIG = {
  name: 'Ahmad Traders',
  subtitle: 'Confectionery & Cold Drinks Distribution ERP',
  address: 'Khuram Chowk, Tezab Mills Road, Faisalabad, Pakistan',
  phone1: '03057165320',
  phone2: '03040402614',
  phones: ['03057165320', '03040402614'] as const,
  currency: 'PKR',
  currencySymbol: 'Rs.',
  timezone: 'Asia/Karachi',
  dateFormat: 'DD-MM-YYYY',
  categories: ['Confectionery', 'Cold Drinks'] as const,
  packagingUnits: ['Piece', 'Box', 'Pack', 'Carton', 'Bottle', 'Crate'] as const,
  partyCategories: {
    A: 'High Volume (A)',
    B: 'Medium Volume (B)',
    C: 'Low Volume (C)',
  },
};

/**
 * Format numbers as PKR currency
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Number(amount).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format date strictly in DD-MM-YYYY format in Asia/Karachi timezone
 */
export function formatDateDDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      // If it's already in YYYY-MM-DD string format:
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, day] = dateInput.split('-');
        return `${day}-${m}-${y}`;
      }
      return String(dateInput);
    }
    // Format to Asia/Karachi
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    // en-GB outputs dd/mm/yyyy
    return formatter.format(d).replace(/\//g, '-');
  } catch {
    return String(dateInput);
  }
}

/**
 * Returns today's business date as YYYY-MM-DD in Asia/Karachi timezone
 */
export function getTodayKarachiDate(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    // en-CA produces YYYY-MM-DD
    return formatter.format(now);
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Unit conversion helper
 * Calculates base units (e.g. bottles or pieces) given carton/pack multipliers
 */
export function convertUnitQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  product?: Partial<Product>
): number {
  if (fromUnit === toUnit) return quantity;
  const unitsPerCarton = product?.unitsPerCarton || 24;
  const unitsPerPack = product?.unitsPerPack || 12;

  // Convert fromUnit to base single unit (Piece/Bottle)
  let baseQuantity = quantity;
  const lowerFrom = fromUnit.toLowerCase();
  if (lowerFrom.includes('carton') || lowerFrom.includes('crate') || lowerFrom.includes('case')) {
    baseQuantity = quantity * unitsPerCarton;
  } else if (lowerFrom.includes('pack') || lowerFrom.includes('box')) {
    baseQuantity = quantity * unitsPerPack;
  }

  // Convert base single unit to toUnit
  const lowerTo = toUnit.toLowerCase();
  if (lowerTo.includes('carton') || lowerTo.includes('crate') || lowerTo.includes('case')) {
    return baseQuantity / unitsPerCarton;
  } else if (lowerTo.includes('pack') || lowerTo.includes('box')) {
    return baseQuantity / unitsPerPack;
  }

  return baseQuantity;
}
