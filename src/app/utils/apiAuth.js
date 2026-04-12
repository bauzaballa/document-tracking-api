const axios = require("axios");

const apiAuth = axios.create({
  baseURL: process.env.AUTH_API_URL,
  withCredentials: true
});

// Interceptor para incluir el token en cada solicitud
apiAuth.interceptors.request.use(
  (config) => {
    const token = process.env.AUTH_API_KEY;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

module.exports = apiAuth;
