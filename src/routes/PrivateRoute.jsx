import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/AuthContext.jsx'

// Área fechada: sem sessão, redireciona para o login.
export default function PrivateRoute() {
  const { signed } = useAuth()
  return signed ? <Outlet /> : <Navigate to="/login" replace />
}
