import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
})

// Interceptador: Executa antes de qualquer requisição sair do React
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@GestorIA:token')

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

export default api
