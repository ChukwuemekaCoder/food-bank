import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute() {
  const { accessToken } = useAuth()
  if (!accessToken) return <Navigate to="/login" replace />
  return <Outlet />
}
