import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("@GestorIA:token");
    if (token) {
      setUser({ logado: true });
    }
  }, []);

  async function cadastro(email, nome_completo, password, re_password) {
    await api.post("/auth/users/", {
      email,
      nome_completo,
      password,
      re_password,
    });
    alert("Conta criada com sucesso, faça o login.");
    navigate("/login");
  }

  async function login(email, password) {
    const response = await api.post("auth/jwt/create", { email, password });

    localStorage.setItem("@GestorIA:token", response.data.access);
    localStorage.setItem("@GestorIA:refresh", response.data.refresh);

    setUser({ email });
    navigate("/home");
  }

  async function logout() {
    const refreshToken = localStorage.getItem("@GestorIA:refresh");

    try {
      if (refreshToken) {
        await api.post("/auth/jwt/logout/", { refresh: refreshToken });
      }
    } catch (error) {
      console.error("Não foi possível invalidar o token no backend:", error);
    } finally {
      localStorage.removeItem("@GestorIA:token");
      localStorage.removeItem("@GestorIA:refresh");
      setUser(null);
      navigate("/login");
    }
  }

  return (
    <AuthContext.Provider
      value={{ signed: !!user, user, login, logout, cadastro }}
    >
      {children}
    </AuthContext.Provider>
  );
}
