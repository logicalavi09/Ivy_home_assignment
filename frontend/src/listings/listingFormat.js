export function titleCase(value) {
  if (!value) return '—'
  return String(value).replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatInr(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const amount = Number(value)
  if (amount <= 0) return '—'
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1)} L`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}