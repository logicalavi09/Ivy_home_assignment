const SEARCHABLE_FIELDS = [
  'apartment_name',
  'title',
  'name',
  'locality',
  'property_type',
  'furnishing',
  'description',
  'listing_id',
]

function normalize(value) {
  return String(value ?? '').toLowerCase()
}

export function applySearch(items, query) {
  const trimmed = normalize(query).trim()
  if (!trimmed) return items

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    const haystack = SEARCHABLE_FIELDS.map((field) => normalize(item[field])).join(' ')
    return tokens.every((token) => haystack.includes(token))
  })
}