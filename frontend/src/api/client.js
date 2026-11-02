import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("diamond_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("diamond_token");
      localStorage.removeItem("diamond_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// Builds a browsable URL for a file stored on the backend's public disk
// (used for X-ray/photo attachments). Assumes `php artisan storage:link`
// has been run on the backend.
export function storageUrl(filePath) {
  const origin = baseURL.replace(/\/api\/v1\/?$/, "");
  return `${origin}/storage/${filePath}`;
}
