// Currency utilities for USD and UZS

export type Currency = 'USD' | 'UZS'

export const currencies: Record<
  Currency,
  { code: Currency; symbol: string; name: string; decimals: number }
> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
  },
  UZS: {
    code: 'UZS',
    symbol: "so'm",
    name: 'Uzbek Som',
    decimals: 0,
  },
}

// Default exchange rate (can be updated from API)
const DEFAULT_USD_TO_UZS = 12500

export function formatCurrency(amount: number, currency: Currency): string {
  const config = currencies[currency]

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(amount)
  }

  // For UZS, format with space separator and append so'm
  const formatted = new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return `${formatted} so'm`
}

export function formatCompactCurrency(
  amount: number,
  currency: Currency,
): string {
  if (currency === 'USD') {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return formatCurrency(amount, currency)
  }

  // For UZS
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} mlrd so'm`
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} mln so'm`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)} ming so'm`
  }
  return formatCurrency(amount, currency)
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  exchangeRate?: number,
): { amount: number; rate: number } {
  if (from === to) {
    return { amount, rate: 1 }
  }

  const rate = exchangeRate || DEFAULT_USD_TO_UZS

  if (from === 'USD' && to === 'UZS') {
    return { amount: amount * rate, rate }
  }

  if (from === 'UZS' && to === 'USD') {
    return { amount: amount / rate, rate: 1 / rate }
  }

  return { amount, rate: 1 }
}

export function parseCurrencyInput(value: string): number {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function getCurrencySymbol(currency: Currency): string {
  return currencies[currency].symbol
}

export function getCurrencyName(currency: Currency): string {
  return currencies[currency].name
}

// Calculate monthly equivalent for different frequencies
export function toMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly':
      return amount * 4.33 // Average weeks per month
    case 'biweekly':
      return amount * 2.17
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'annual':
      return amount / 12
    case 'one_time':
      return 0 // One-time doesn't contribute to monthly
    default:
      return amount
  }
}

// Calculate annual equivalent
export function toAnnualAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly':
      return amount * 52
    case 'biweekly':
      return amount * 26
    case 'monthly':
      return amount * 12
    case 'quarterly':
      return amount * 4
    case 'annual':
      return amount
    case 'one_time':
      return amount
    default:
      return amount * 12
  }
}
