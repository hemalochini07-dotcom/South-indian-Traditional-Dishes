
const API_BASE_URL = "http://127.0.0.1:8000";

export type ApiUser = {
  email: string;
  role: "Admin" | "Staff";
};

let currentUser: ApiUser | null = null;

export function setApiUser(user: ApiUser | null) {
  currentUser = user;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (currentUser) {
    headers.set("x-user-email", currentUser.email);
    headers.set("x-user-role", currentUser.role);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const responseText = await response.text();

  if (!response.ok) {
    let message = responseText || "Backend request failed.";

    try {
      const errorData = JSON.parse(responseText);
      message =
        errorData.detail || errorData.message || message;
    } catch {
      // Keep the original response text.
    }

    throw new Error(message);
  }

  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}

export function apiGet<T = any>(path: string) {
  return apiFetch<T>(path);
}

export function apiPost<T = any>(path: string, data: unknown) {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function apiPut<T = any>(path: string, data: unknown) {
  return apiFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function apiDelete<T = any>(path: string) {
  return apiFetch<T>(path, {
    method: "DELETE",
  });
}
