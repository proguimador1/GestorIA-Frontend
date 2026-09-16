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

const ERROR_MESSAGES = {
  400: "Verifique os dados informados.",
  403: "Você não tem permissão para essa ação.",
  404: "Recurso não encontrado.",
  500: "Erro interno do servidor. Tente novamente mais tarde.",
};

function extractMessage(error) {
  const { response } = error;

  if (!response) return "Não foi possível conectar ao servidor.";

  const { status, data } = response;

  if (status === 400 && data && typeof data === "object" && !data.detail) {
    const primeiraChave = Object.keys(data)[0];
    const valor = data[primeiraChave];
    const primeiraMsg = Array.isArray(valor) ? valor[0] : valor;
    if (primeiraMsg) return primeiraMsg;
  }

  if (data?.detail) return data.detail;

  return ERROR_MESSAGES[status] || "Ocorreu um erro inesperado.";
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = extractMessage(error);

    if (error.response?.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
