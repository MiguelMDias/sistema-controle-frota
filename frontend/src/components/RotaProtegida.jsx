import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../services/auth'

export default function RotaProtegida() {
  const { auth } = useAuth()

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
