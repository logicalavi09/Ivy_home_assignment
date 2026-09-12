import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { SavedProvider } from './saved/SavedContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Listings = lazy(() => import('./pages/Listings'))
const ListingDetail = lazy(() => import('./pages/ListingDetail'))
const SavedListings = lazy(() => import('./pages/SavedListings'))
const Rentals = lazy(() => import('./pages/Rentals'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Insights = lazy(() => import('./pages/Insights'))

function PageLoader() {
  return (
    <div className="page-loading" role="status" aria-label="Loading page">
      <span className="skeleton skeleton-line" style={{ width: 220 }} />
      <span className="skeleton skeleton-line" style={{ width: 140 }} />
      <span className="skeleton skeleton-block" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SavedProvider>
        <HashRouter>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </HashRouter>
      </SavedProvider>
    </AuthProvider>
  )
}