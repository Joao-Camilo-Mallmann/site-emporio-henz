import axios from "axios";

export const api = axios.create({
  baseURL: `http://localhost:${import.meta.env.PORT}`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de Requisição: Injeta automaticamente Authorization: Bearer <token>
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor de Resposta: Captura 401 global e redireciona para /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Sessão expirada (401). Redirecionando para login...");
      localStorage.removeItem("token");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/equipe/login")
      ) {
        window.location.href = "/login";
      }
    } else {
      console.error(
        "Erro na requisição Axios:",
        error.response?.data || error.message,
      );
    }
    return Promise.reject(error);
  },
);

export default api;
