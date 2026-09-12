import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login as apiLogin, logout as apiLogout, performRefresh } from '../api/client'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getUser,
  isTokenExpired,
} from '../auth/tokenStorage'

const AuthContext = createContext(null)

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.')
  }
  return context
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const token = getAccessToken()
      if (!token) {
        if (!cancelled) setInitializing(false)
        return
      }

      if (isTokenExpired(0)) {
        if (getRefreshToken()) {
          try {
            await performRefresh()
          } catch {
            clearSession()
          }
        } else {
          clearSession()
        }
      }

      if (!cancelled) {
        setUser(getUser())
        setInitializing(false)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    setUser(getUser())
    return data
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && getAccessToken()),
      initializing,
      login,
      logout,
    }),
    [user, initializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthProvider, useAuth }