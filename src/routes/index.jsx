import { Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import SolicitarRecuperacao from '../pages/Recuperacao/solicitar';
import RedefinirSenha from '../pages/Recuperacao/redefinir';
import Home from '../pages/Home';


export default function AppRoutes() {
    return (
        <Routes>
            {/* Área Pública */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<SolicitarRecuperacao />} />
            <Route path="/recuperar-senha/:uid/:token" element={<RedefinirSenha />} />

            {/* Área Fechada (Exige Token JWT) */}
            <Route element={<PrivateRoute />}>
                <Route path="/home" element={<Home />} />
            </Route>
        </Routes>
    );
}