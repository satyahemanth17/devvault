'use client';

import { useState } from 'react';
import { api, type SecretMeta } from '@/lib/api';
import { decrypt } from '@/lib/crypto';

interface Props {
  secret: SecretMeta;
  workspaceId: string;
  onDelete?: () => void;
}

const categoryColors: Record<string, string> = {
  api_key: '#10b981',
  database: '#3b82f6',
  oauth: '#8b5cf6',
  ssh: '#f59e0b',
  general: '#6b7280',
};

export default function SecretCard({ secret, workspaceId, onDelete }: Props) {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDecrypt() {
    setLoading(true);
    setError('');
    try {
      const full = await api.getSecret(workspaceId, secret.id);
      const plaintext = await decrypt(full.encryptedBlob, full.iv, full.salt, password);
      setDecrypted(plaintext);
      setShowPrompt(false);
      setPassword('');
      setTimeout(() => setDecrypted(null), 30_000);
    } catch {
      setError('Wrong password or decryption failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete secret "${secret.name}"?`)) return;
    await api.deleteSecret(workspaceId, secret.id);
    onDelete?.();
  }

  const catColor = categoryColors[secret.category] ?? '#6b7280';

  return (
    <div className="p-4 rounded border" style={{ background: '#111111', borderColor: '#222222' }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="flex-shrink-0"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="font-medium text-sm text-white truncate">{secret.name}</span>
          </div>
          {secret.description && (
            <p className="text-xs truncate" style={{ color: '#6b7280' }}>
              {secret.description}
            </p>
          )}
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded font-mono flex-shrink-0"
          style={{
            background: `${catColor}22`,
            color: catColor,
            border: `1px solid ${catColor}44`,
          }}
        >
          {secret.category}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs mb-3" style={{ color: '#6b7280' }}>
        <span>v{secret.version}</span>
        <span>·</span>
        <span>{new Date(secret.createdAt).toLocaleDateString()}</span>
        {secret.expiresAt && (
          <>
            <span>·</span>
            <span style={{ color: '#f59e0b' }}>
              expires {new Date(secret.expiresAt).toLocaleDateString()}
            </span>
          </>
        )}
      </div>

      {decrypted && (
        <div
          className="mb-3 p-2 rounded font-mono text-xs break-all"
          style={{ background: '#0a0a0a', border: '1px solid #10b981', color: '#10b981' }}
        >
          {decrypted}
          <div className="mt-1 font-sans" style={{ color: '#6b7280' }}>
            Auto-clears in 30s
          </div>
        </div>
      )}

      {showPrompt && !decrypted && (
        <div className="mb-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
            placeholder="Enter workspace password"
            className="w-full px-3 py-2 text-xs rounded border bg-transparent text-white focus:outline-none focus:border-white"
            style={{ borderColor: '#333' }}
            autoFocus
          />
          {error && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
              {error}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!decrypted ? (
          <button
            onClick={() => (showPrompt ? handleDecrypt() : setShowPrompt(true))}
            disabled={loading}
            className="flex-1 text-xs py-1.5 rounded border font-medium transition-colors"
            style={{ borderColor: '#333', color: '#6b7280' }}
          >
            {loading ? '…' : showPrompt ? 'Decrypt' : 'Reveal'}
          </button>
        ) : (
          <button
            onClick={() => setDecrypted(null)}
            className="flex-1 text-xs py-1.5 rounded border font-medium"
            style={{ borderColor: '#10b981', color: '#10b981' }}
          >
            Hide
          </button>
        )}
        <button
          onClick={handleDelete}
          className="text-xs px-3 py-1.5 rounded border transition-colors"
          style={{ borderColor: '#222', color: '#6b7280' }}
        >
          Del
        </button>
      </div>
    </div>
  );
}
