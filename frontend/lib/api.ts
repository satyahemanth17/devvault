const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5002/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('devvault_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export interface SecretMeta {
  id: string;
  name: string;
  description: string | null;
  category: string;
  version: number;
  ownerId: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SecretFull extends SecretMeta {
  encryptedBlob: string;
  iv: string;
  salt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: { username: string; avatarUrl: string | null };
}

export interface AuditPage {
  logs: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

export const api = {
  getMe: () => request<User>('/auth/me'),

  getWorkspaces: () => request<Workspace[]>('/workspaces'),
  createWorkspace: (name: string, description?: string) =>
    request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  getSecrets: (workspaceId: string) =>
    request<SecretMeta[]>(`/workspaces/${workspaceId}/secrets`),

  getSecret: (workspaceId: string, secretId: string) =>
    request<SecretFull>(`/workspaces/${workspaceId}/secrets/${secretId}`),

  createSecret: (
    workspaceId: string,
    data: {
      name: string;
      description?: string;
      encryptedBlob: string;
      iv: string;
      salt: string;
      category?: string;
    }
  ) =>
    request<SecretMeta>(`/workspaces/${workspaceId}/secrets`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSecret: async (workspaceId: string, secretId: string) => {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/secrets/${secretId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },

  getAuditLog: (workspaceId: string, limit = 50, offset = 0) =>
    request<AuditPage>(
      `/workspaces/${workspaceId}/audit?limit=${limit}&offset=${offset}`
    ),
};
