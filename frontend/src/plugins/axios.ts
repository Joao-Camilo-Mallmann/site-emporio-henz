import { getCookie, removeAuthToken } from "@/utils/cookie";
import axios from "axios";

const rawApiUrl =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "";
const apiBase = rawApiUrl.replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${apiBase}/api/v1`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de Requisição: Injeta automaticamente Authorization: Bearer <token>
api.interceptors.request.use(
  (config) => {
    const token = getCookie(); 
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
      console.warn("Sessão expirada ou não autenticada (401).");
      removeAuthToken();
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
