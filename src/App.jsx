import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import { Modal, Toast } from './components/Overlays.jsx'
import PrivateRoute from './routes/PrivateRoute.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import Inicio from './pages/Inicio.jsx'
import Cadastro from './pages/Cadastro.jsx'
import Financas from './pages/Financas.jsx'
import Notas from './pages/Notas.jsx'
import Chatbot from './pages/Chatbot.jsx'
import Configuracoes from './pages/Configuracoes.jsx'

// Moldura da área logada: menu lateral, cabeçalho, modal e aviso.
function Layout() {
  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Topbar />
          <main className="wrap"><Outlet /></main>
        </div>
      </div>
      <Modal />
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Área pública */}
      <Route path="/login" element={<Login />} />
      <Route path="/criar-conta" element={<Register />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route path="/recuperar-senha/:uid/:token" element={<ResetPassword />} />

      {/* Área fechada (exige sessão) */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/financas" element={<Financas />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  )
}
