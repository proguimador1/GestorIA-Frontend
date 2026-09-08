import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Interceptador: Executa antes de qualquer requisição sair do React
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@GestorIA:token");

  const rotasPublicas = [
    "/auth/jwt/create/", // Login
    "/auth/users/", // Cadastro
    "/auth/users/reset_password/", // Pedir email de recuperação
    "/auth/users/reset_password_confirm/", // Enviar nova senha
  ];

  const isRotaPublica = rotasPublicas.includes(config.url);

  if (token && !isRotaPublica) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
