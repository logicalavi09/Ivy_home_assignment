import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Building2, Heart, Home, LayoutDashboard, LogOut, Menu, Search, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import BackToTop from './BackToTop'
import PageTransition from './PageTransition'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/listings', label: 'Listings', icon: Home },
  { to: '/rentals', label: 'Rentals', icon: Search },
  { to: '/projects', label: 'Projects', icon: Building2 },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/saved', label: 'Saved', icon: Heart },
]

function NavItems({ onNavigate }) {
  return NAV_LINKS.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
      onClick={onNavigate}
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </NavLink>
  ))
}

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const identity = user?.name || user?.full_name || user?.email || 'Account'
  const initials = identity
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/dashboard" className="brand">
            <span className="brand-mark" aria-hidden="true">
              I
            </span>
            Ivy&nbsp;Homes
          </NavLink>

          <nav className="nav" aria-label="Primary">
            <NavItems />
          </nav>

          <div className="topbar-right">
            <span className="user-chip" title={identity}>
              <span className="user-avatar">{initials || 'I'}</span>
              <span className="user-chip-name">{identity}</span>
            </span>
            <button type="button" className="ghost" onClick={logout} aria-label="Sign out">
              <LogOut size={16} aria-hidden="true" />
              <span className="logout-label">Sign out</span>
            </button>
            <button
              type="button"
              className="menu-button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              className="mobile-menu"
              aria-label="Mobile"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="shell">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      <BackToTop />
    </>
  )
}