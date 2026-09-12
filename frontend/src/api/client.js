import axios from 'axios'
import {
  getAccessToken,
  getRefreshToken,
  setSession,
  clearSession,
  isTokenExpired,
} from '../auth/tokenStorage'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const REFRESH_BUFFER_MS = 60 * 1000

const AUTH_PATHS = new Set(['/auth/login', '/auth/refresh', '/auth/logout'])

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

const refreshClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

function redirectToLogin() {
  clearSession()
  if (!window.location.hash.startsWith('#/login')) {
    window.location.hash = '/login'
  }
}

let refreshPromise = null

async function performRefresh() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available.')
    }
    const { data } = await refreshClient.post('/auth/refresh', { refresh_token: refreshToken })
    setSession(data)
    return getAccessToken()
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise.catch((err) => {
    redirectToLogin()
    throw err
  })
}

client.interceptors.request.use(async (config) => {
  // Never send a token during /auth/login, /auth/refresh or /auth/logout.
  if (AUTH_PATHS.has(config.url)) {
    if (config.headers) delete config.headers.Authorization
    return config
  }

  const token = getAccessToken()
  if (!token) return config

  config.headers.Authorization = `Bearer ${token}`

  if (isTokenExpired(REFRESH_BUFFER_MS)) {
    try {
      await performRefresh()
      config.headers.Authorization = `Bearer ${getAccessToken()}`
    } catch {
      return config
    }
  }

  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (!config || !response) return Promise.reject(error)
    if (AUTH_PATHS.has(config.url)) return Promise.reject(error)
    if (response.status !== 401 || config.retried) return Promise.reject(error)

    config.retried = true

    try {
      await performRefresh()
      const freshToken = getAccessToken()
      if (!freshToken) return Promise.reject(error)
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${freshToken}`
      return client(config)
    } catch {
      return Promise.reject(error)
    }
  },
)

async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password })
  setSession(data)
  return data
}

async function logout() {
  try {
    const refreshToken = getRefreshToken()
    await refreshClient.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {})
  } catch {
    // Server-side session invalidation is best-effort; always clear locally.
  } finally {
    clearSession()
  }
}

export { client as default, login, logout, performRefresh }