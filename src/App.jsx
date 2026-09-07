import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes'; // Importa o index.jsx da pasta routes

export default function App() {
  return (
    /* BrowserRouter: Ativa a capacidade do React de entender URLs */
    <BrowserRouter>

      <AuthProvider>

        <AppRoutes />

      </AuthProvider>

    </BrowserRouter>
  );
}
