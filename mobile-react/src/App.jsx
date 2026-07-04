import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import LoginPage from './pages/Login'
import AdminPage from './pages/Admin'
import HomePage from './pages/Home'
import { getUser } from './utils/api'

function RequireAuth({ children, role }) {
  const user = getUser()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />
  }
  return children
}

function RedirectIfLoggedIn() {
  const user = getUser()
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />
  }
  return <LoginPage />
}

export default function App() {
  return (
    <div className="app-container">
      <HashRouter>
        <Routes>
          <Route path="/login" element={<RedirectIfLoggedIn />} />
          <Route path="/admin" element={
            <RequireAuth role="admin"><AdminPage /></RequireAuth>
          } />
          <Route path="/home" element={
            <RequireAuth><HomePage /></RequireAuth>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </div>
  )
}
