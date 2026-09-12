import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()

  const identity = user?.name || user?.full_name || user?.email || 'Account'

  function handleLogout() {
    logout()
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">Ivy Homes</span>
          <nav className="nav">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Dashboard
            </NavLink>
            <NavLink to="/listings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Listings
            </NavLink>
            <NavLink to="/rentals" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Rentals
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Projects
            </NavLink>
            <NavLink to="/insights" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Insights
            </NavLink>
            <NavLink to="/saved" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Saved
            </NavLink>
          </nav>
          <div className="topbar-right">
            <span className="topbar-user">{identity}</span>
            <button type="button" className="ghost" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="shell">
        <Outlet />
      </main>
    </>
  )
}