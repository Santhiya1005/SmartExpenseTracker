import axios from "axios";

export const BASE_URL = "http://localhost:5000";

export const api = axios.create({
  baseURL: BASE_URL,
});

// every request automatically attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});