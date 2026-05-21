'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api, type SecretMeta } from '@/lib/api';
import { decrypt, encrypt } from '@/lib/crypto';

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

  const [showRotate, setShowRotate] = useState(false);
  const [rotateCurrPw, setRotateCurrPw] = useState('');
  const [rotateNewVal, setRotateNewVal] = useState('');
  const [rotateNewPw, setRotateNewPw] = useState('');
  const [rotateError, setRotateError] = useState('');
  const [rotateLoading, setRotateLoading] = useState(false);
  const [rotateSuccess, setRotateSuccess] = useState(false);

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

  async function handleRotate() {
    if (!rotateCurrPw || !rotateNewVal || !rotateNewPw) {
      setRotateError('All three fields are required');
      return;
    }
    setRotateLoading(true);
    setRotateError('');
    try {
      const full = await api.getSecret(workspaceId, secret.id);
      await decrypt(full.encryptedBlob, full.iv, full.salt, rotateCurrPw);
      const { encryptedBlob, iv, salt } = await encrypt(rotateNewVal, rotateNewPw);
      await api.rotateSecret(workspaceId, secret.id, { encryptedBlob, iv, salt });
      setRotateSuccess(true);
      setTimeout(() => {
        setShowRotate(false);
        setRotateSuccess(false);
        setRotateCurrPw('');
        setRotateNewVal('');
        setRotateNewPw('');
        onDelete?.();
      }, 800);
    } catch (err) {
      setRotateError(err instanceof Error ? err.message : 'Rotation failed');
    } finally {
      setRotateLoading(false);
    }
  }

  const catColor = categoryColors[secret.category] ?? '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="p-4 rounded border"
      style={{ background: '#111111', borderColor: '#222222' }}
    >
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
          <motion.button
            onClick={() => (showPrompt ? handleDecrypt() : setShowPrompt(true))}
            disabled={loading}
            className="flex-1 text-xs py-1.5 rounded border font-medium transition-colors cursor-pointer"
            style={{ borderColor: '#333', color: '#6b7280' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {loading ? '…' : showPrompt ? 'Decrypt' : 'Reveal'}
          </motion.button>
        ) : (
          <motion.button
            onClick={() => setDecrypted(null)}
            className="flex-1 text-xs py-1.5 rounded border font-medium cursor-pointer"
            style={{ borderColor: '#10b981', color: '#10b981' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            Hide
          </motion.button>
        )}
        <motion.button
          onClick={handleDelete}
          className="text-xs px-3 py-1.5 rounded border transition-colors cursor-pointer"
          style={{ borderColor: '#222', color: '#6b7280' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          Del
        </motion.button>
        <motion.button
          onClick={() => { setShowRotate(!showRotate); setRotateError(''); }}
          className="text-xs px-3 py-1.5 rounded border transition-colors cursor-pointer"
          style={{ borderColor: '#10b98144', color: '#10b981' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          Rotate
        </motion.button>
      </div>

      {showRotate && !rotateSuccess && (
        <div className="mt-3 space-y-2">
          <input
            type="password"
            value={rotateCurrPw}
            onChange={(e) => setRotateCurrPw(e.target.value)}
            placeholder="Current password"
            className="w-full px-3 py-2 text-xs rounded border bg-transparent text-white focus:outline-none focus:border-white"
            style={{ borderColor: '#333' }}
            autoFocus
          />
          <textarea
            value={rotateNewVal}
            onChange={(e) => setRotateNewVal(e.target.value)}
            placeholder="New secret value"
            rows={2}
            className="w-full px-3 py-2 text-xs rounded border bg-transparent text-white focus:outline-none focus:border-white font-mono resize-none"
            style={{ borderColor: '#333' }}
          />
          <input
            type="password"
            value={rotateNewPw}
            onChange={(e) => setRotateNewPw(e.target.value)}
            placeholder="New encryption password"
            className="w-full px-3 py-2 text-xs rounded border bg-transparent text-white focus:outline-none focus:border-white"
            style={{ borderColor: '#333' }}
          />
          {rotateError && (
            <p className="text-xs" style={{ color: '#ef4444' }}>
              {rotateError}
            </p>
          )}
          <div className="flex gap-2">
            <motion.button
              onClick={handleRotate}
              disabled={rotateLoading}
              className="flex-1 text-xs py-1.5 rounded border font-medium cursor-pointer"
              style={{ borderColor: '#10b981', color: '#10b981' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              {rotateLoading ? '…' : 'Confirm Rotate'}
            </motion.button>
            <motion.button
              onClick={() => { setShowRotate(false); setRotateError(''); }}
              className="text-xs px-3 py-1.5 rounded border cursor-pointer"
              style={{ borderColor: '#333', color: '#6b7280' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      )}

      {rotateSuccess && (
        <div
          className="mt-3 text-xs text-center py-2 rounded"
          style={{ color: '#10b981', background: '#10b98111' }}
        >
          Secret rotated successfully
        </div>
      )}
    </motion.div>
  );
}
