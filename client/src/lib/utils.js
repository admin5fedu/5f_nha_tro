import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format number with thousand separators
export function formatNumber(num) {
  if (num === null || num === undefined || num === '') return '';
  const numStr = typeof num === 'string' ? num : num.toString();
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Parse formatted number to float
export function parseNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '')) || 0;
}

// Format number input value (for use in input fields)
export function formatNumberInput(value) {
  if (!value && value !== 0) return '';
  const numStr = value.toString().replace(/,/g, '');
  return formatNumber(numStr);
}
