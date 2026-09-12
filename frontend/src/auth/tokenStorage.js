const ACCESS_TOKEN_KEY = 'ivy.access_token'
const REFRESH_TOKEN_KEY = 'ivy.refresh_token'
const USER_KEY = 'ivy.user'
const EXPIRES_AT_KEY = 'ivy.expires_at'

const FALLBACK_TTL_MS = 15 * 60 * 1000

function extractUser(data) {
  if (data.user != null) return data.user

  const ignored = new Set(['access_token', 'refresh_token', 'token', 'token_type', 'expires_in', 'expires_at', 'refresh_url'])
  const user = {}
  for (const [key, value] of Object.entries(data)) {
    if (!ignored.has(key)) user[key] = value
  }
  return Object.keys(user).length > 0 ? user : undefined
}

function jwtExpiryMs(accessToken) {
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function computeExpiryMs(data, now = Date.now()) {
  if (data.expires_at) {
    const parsed = new Date(data.expires_at).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }
  const fromJwt = data.access_token ? jwtExpiryMs(data.access_token) : null
  if (fromJwt) return fromJwt
  if (typeof data.expires_in === 'number') return now + data.expires_in * 1000
  return now + FALLBACK_TTL_MS
}

export function getAccessToken() {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getUser() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getExpiresAt() {
  if (typeof localStorage === 'undefined') return null
  const value = Number(localStorage.getItem(EXPIRES_AT_KEY))
  return Number.isFinite(value) && value > 0 ? value : null
}

export function setSession(data) {
  if (!data || !data.access_token) {
    throw new Error('Login/refresh response did not include an access_token.')
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)
  if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
  localStorage.setItem(EXPIRES_AT_KEY, String(computeExpiryMs(data)))

  const user = extractUser(data)
  if (user !== undefined) {
    const current = getUser()
    localStorage.setItem(USER_KEY, JSON.stringify(user ?? current ?? null))
  }
}

export function setUserEmail(email) {
  if (typeof localStorage === 'undefined') return
  const current = getUser() || {}
  localStorage.setItem(USER_KEY, JSON.stringify({ ...current, email }))
}

export function isTokenExpired(bufferMs = 0) {
  const expiresAt = getExpiresAt()
  if (expiresAt === null) return false
  return Date.now() + bufferMs >= expiresAt
}

export function hasSession() {
  return Boolean(getAccessToken())
}

export function clearSession() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}