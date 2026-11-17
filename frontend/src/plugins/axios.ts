import axios from "axios";

const rawApiUrl =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "";
/** Origem da API para URLs de arquivos; as chamadas HTTP usam o proxy same-origin. */
export const apiBase = rawApiUrl.replace(/\/$/, "");

export const api = axios.create({
  baseURL: "/api/v1",
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Registra falhas sem tentar ler ou apagar o cookie HttpOnly no cliente.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Sessão expirada ou não autenticada (401).");
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
