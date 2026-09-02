import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "Erro na requisição Axios:",
      error.response?.data || error.message,
    );
    return Promise.reject(error);
  },
);

export default api;
