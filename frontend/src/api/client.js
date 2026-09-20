const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const getToken = () => localStorage.getItem("tracex_token");
export const setToken = (token) => localStorage.setItem("tracex_token", token);
export const clearAuth = () => {
  localStorage.removeItem("tracex_token");
  localStorage.removeItem("tracex_officer");
};
export const getOfficer = () => {
  const data = localStorage.getItem("tracex_officer");
  return data ? JSON.parse(data) : null;
};
export const setOfficer = (officer) => {
  localStorage.setItem("tracex_officer", JSON.stringify(officer));
};

export async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If body is JSON object and not FormData, set Content-Type
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
    if (typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
    }
  }

  const cleanEndpoint = endpoint.replace(/^\//, "");
  let primaryBase = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

  // Auto-detect production on Render or missing VITE_API_BASE_URL
  if (!primaryBase || primaryBase.includes("localhost") || primaryBase.includes("127.0.0.1")) {
    if (typeof window !== "undefined" && window.location.hostname.includes("onrender.com")) {
      primaryBase = "https://tracex-backend-3.onrender.com/api";
    } else if (!primaryBase) {
      primaryBase = "http://localhost:8000/api";
    }
  }

  // Ensure base URL always ends with /api to prevent 404 routing errors
  if (!primaryBase.endsWith("/api")) {
    primaryBase = `${primaryBase}/api`;
  }

  // Build candidate URL list to seamlessly handle IPv4/IPv6 and fallback URLs
  const candidateBases = [primaryBase];
  if (primaryBase.includes("localhost:8000")) {
    candidateBases.push("http://127.0.0.1:8000/api", "/api");
  } else if (primaryBase.includes("127.0.0.1:8000")) {
    candidateBases.push("http://localhost:8000/api", "/api");
  } else if (primaryBase.includes("onrender.com")) {
    candidateBases.push("https://tracex-backend-3.onrender.com/api");
  }

  let lastError = null;

  for (let i = 0; i < candidateBases.length; i++) {
    const baseUrl = candidateBases[i];
    const url = `${baseUrl}/${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        clearAuth();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        throw new Error("Session expired or invalid credentials. Please log in.");
      }

      if (!response.ok) {
        let errorDetail = `Request failed (${response.status})`;
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.detail || errorDetail;
        } catch {
          // Not JSON
        }
        const err = new Error(errorDetail);
        err.status = response.status;
        throw err;
      }

      // Check if response is PDF or JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/pdf")) {
        return response;
      }

      // Default to JSON
      return await response.json();
    } catch (err) {
      lastError = err;
      const isNetworkError =
        err.name === "TypeError" ||
        err.message.includes("fetch") ||
        err.message.includes("NetworkError") ||
        err.message.includes("Failed to fetch");

      // Only retry on network/connection failure, not HTTP errors like 401, 404, etc.
      if (isNetworkError && i < candidateBases.length - 1) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PUT", body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;
