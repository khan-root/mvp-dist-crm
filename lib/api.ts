const API_BASE = "";

/**
 * Returns the base URL for server-side API fetch calls.
 * Uses VERCEL_URL on Vercel (set automatically), otherwise NEXT_PUBLIC_APP_URL or localhost.
 */
export function getServerApiBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
  company_name: string;
  subdomain?: string;
}

export interface MeResponse {
  user: AuthUser | null;
}
