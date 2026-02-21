const API_BASE = "";

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
