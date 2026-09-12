export const LOCALITIES = [
  'aundh',
  'balewadi',
  'baner',
  'hadapsar',
  'hinjewadi',
  'kharadi',
  'kothrud',
  'magarpatta',
  'viman nagar',
  'wakad',
]

export const BHK_OPTIONS = [
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4+', label: '4+ BHK' },
]

export const FURNISHING_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi-furnished', label: 'Semi-furnished' },
  { value: 'fully-furnished', label: 'Fully-furnished' },
]

export const EMPTY_FILTERS = {
  locality: '',
  bhk: '',
  furnishing: '',
  minPrice: '',
  maxPrice: '',
}

const PRICE_LAKHS_TO_INR = 1e5

export function filtersToParams(filters, pageSize = 50) {
  const params = { limit: pageSize }
  if (filters.locality) params.locality = filters.locality
  if (filters.bhk) {
    if (filters.bhk === '4+') {
      params.bedroom_gte = 4
    } else {
      params.bedroom = Number(filters.bhk)
    }
  }
  if (filters.furnishing) params.furnishing = filters.furnishing
  if (filters.minPrice) params.min_price = Math.round(Number(filters.minPrice) * PRICE_LAKHS_TO_INR)
  if (filters.maxPrice) params.max_price = Math.round(Number(filters.maxPrice) * PRICE_LAKHS_TO_INR)
  return params
}