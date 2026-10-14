import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import { Modal, Toast } from './components/Overlays.jsx'
import Inicio from './pages/Inicio.jsx'
import Cadastro from './pages/Cadastro.jsx'
import Financas from './pages/Financas.jsx'
import Notas from './pages/Notas.jsx'
import Chatbot from './pages/Chatbot.jsx'
import Configuracoes from './pages/Configuracoes.jsx'

export default function App() {
  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Topbar />
          <main className="wrap">
            <Routes>
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/financas" element={<Financas />} />
              <Route path="/notas" element={<Notas />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<Navigate to="/inicio" replace />} />
            </Routes>
          </main>
        </div>
      </div>
      <Modal />
      <Toast />
    </>
  )
}
