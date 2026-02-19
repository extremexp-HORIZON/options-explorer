import { getAuthorizationHeader } from "./auth";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function getApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${normalizedEndpoint}`;
}

export async function authenticatedFetch(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const url = getApiUrl(endpoint);
  const headers = new Headers(options?.headers || {});

  const authHeader = getAuthorizationHeader();
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }
  if (options?.body instanceof FormData) {
    if (headers.has("Content-Type")) {
      headers.delete("Content-Type");
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
