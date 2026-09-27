import { CurrencyType } from '../types';

/**
 * Format currency according to standard notation
 * Guaraní: ₲ 1.500.000 (no decimals, dot for thousands)
 * Dólares: $ 1,250.00 (two decimals)
 */
export function formatCurrency(amount: number, currency: CurrencyType = 'PYG'): string {
  if (isNaN(amount)) amount = 0;
  
  if (currency === 'PYG') {
    const rounded = Math.round(amount);
    const formatted = new Intl.NumberFormat('es-PY', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(rounded);
    return `₲ ${formatted}`;
  } else {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `$ ${formatted}`;
  }
}

export function formatCompactCurrency(amount: number, currency: CurrencyType = 'PYG'): string {
  if (Math.abs(amount) >= 1_000_000 && currency === 'PYG') {
    return `₲ ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000 && currency === 'USD') {
    return `$ ${(amount / 1_000).toFixed(1)}k`;
  }
  return formatCurrency(amount, currency);
}

/**
 * Get date string in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date in readable Spanish
 */
export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Get the Monday and Sunday for a given date
 */
export function getWeekRange(dateStr: string): { start: string; end: string; label: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
  
  // Calculate distance to Monday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(current);
  monday.setDate(current.getDate() - distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (dt: Date) => {
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const start = format(monday);
  const end = format(sunday);

  const label = `Lun ${monday.getDate()} ${getMonthName(monday.getMonth())} - Dom ${sunday.getDate()} ${getMonthName(sunday.getMonth())} ${sunday.getFullYear()}`;

  return { start, end, label };
}

export const MONTH_NAMES_SPANISH = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getMonthName(monthIndex: number): string {
  return MONTH_NAMES_SPANISH[monthIndex] || '';
}

/**
 * Generate sequential or unique transaction code
 */
export function generateTransactionCode(existingCodes: string[]): string {
  let maxNum = 1000;
  for (const code of existingCodes) {
    const match = code.match(/TRX-(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `TRX-${maxNum + 1}`;
}
