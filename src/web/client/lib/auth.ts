export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface User {
  user_id: number;
  name: string;
  last_name: string;
  email: string;
  profile_pic?: string | null;
  address?: string;
  birth_date?: string;
  status: string;
  creation_date: string;
  educational_level?: string;
  educational_field?: string;
}

export interface AuthData {
  user: User;
  tokens: AuthTokens;
}
import { API_BASE_URL } from "./api";
const STORAGE_KEYS = {
  ACCESS_TOKEN: "auth_access_token",
  REFRESH_TOKEN: "auth_refresh_token",
  USER: "auth_user",
};

export function saveAuthData(data: AuthData): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.access_token);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refresh_token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
}

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function getStoredUser(): User | null {
  const userJson = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function clearAuthData(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function getAuthorizationHeader(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  return `Bearer ${token}`;
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthData();
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (response.status === 401) {
      clearAuthData();
      return false;
    }

    if (!response.ok) {
      clearAuthData();
      return false;
    }

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      return true;
    }

    clearAuthData();
    return false;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    clearAuthData();
    return false;
  }
}
