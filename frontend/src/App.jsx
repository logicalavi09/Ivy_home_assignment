import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { SavedProvider } from './saved/SavedContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Listings from './pages/Listings'
import ListingDetail from './pages/ListingDetail'
import SavedListings from './pages/SavedListings'
import Rentals from './pages/Rentals'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Insights from './pages/Insights'

export default function App() {
  return (
    <AuthProvider>
      <SavedProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/rentals" element={<Rentals />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/saved" element={<SavedListings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </SavedProvider>
    </AuthProvider>
  )
}