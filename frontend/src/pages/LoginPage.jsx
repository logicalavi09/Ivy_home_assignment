import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const DEMO_EMAIL = 'demo1@ivy.homes'

function friendlyMessage(err) {
  const status = err?.response?.status
  if (status === 401) return 'Invalid credentials. Please check your email and password.'
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (err?.response?.data?.error) return String(err.response.data.error)
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname + (location.state?.from?.search ?? '') || '/dashboard'
    return <Navigate to={destination} replace />
  }

  const passwordValue = password.trim()
  const canSubmit = Boolean(email.trim() && passwordValue && !submitting)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = { email: email.trim(), password: passwordValue }
      await login(payload.email, payload.password)
      const destination = location.state?.from?.pathname + (location.state?.from?.search ?? '') || '/dashboard'
      navigate(destination, { replace: true })
    } catch (err) {
      setError(friendlyMessage(err))
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="login-brand">
          <span className="login-logo" aria-hidden="true">
            <Home size={24} />
          </span>
          <h1>Ivy Homes</h1>
          <p className="muted">Sign in to access listings, rentals, and projects.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your demo password"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="login-button" disabled={!canSubmit}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-hint muted">
          Enter the demo password from your assignment to sign in.
        </p>
      </motion.div>
    </main>
  )
}