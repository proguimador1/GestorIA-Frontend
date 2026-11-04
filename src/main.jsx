import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext.jsx'
import { AppProvider } from './store/AppContext.jsx'
import App from './App.jsx'
import './styles/base.css'
import './styles/components.css'

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </HashRouter>
)
