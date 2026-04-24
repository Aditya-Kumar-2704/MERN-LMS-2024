import axios from "axios";

const DEFAULT_LOCAL_API_URL = "http://localhost:5000";
const LEGACY_LOCAL_API_URL = "http://localhost:8000";

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredBaseUrl || configuredBaseUrl === LEGACY_LOCAL_API_URL) {
    return DEFAULT_LOCAL_API_URL;
  }

  return configuredBaseUrl;
}

const axiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 300000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = JSON.parse(sessionStorage.getItem("accessToken")) || "";

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (err) => Promise.reject(err)
);

export default axiosInstance;
