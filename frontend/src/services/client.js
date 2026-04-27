const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export async function request(path, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.detail || "Request failed.");
  }

  return data;
}
