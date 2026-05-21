'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { encrypt } from '@/lib/crypto';

interface Props {
  workspaceId: string;
  onClose: () => void;
  onAdded: () => void;
}

const CATEGORIES = ['general', 'api_key', 'database', 'oauth', 'ssh'];

export default function AddSecretModal({ workspaceId, onClose, onAdded }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [category, setCategory] = useState('general');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !secretValue || !password) {
      setError('Name, secret value, and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Encrypt in browser — server never sees secretValue or password
      const { encryptedBlob, iv, salt } = await encrypt(secretValue, password);
      await api.createSecret(workspaceId, {
        name,
        description: description || undefined,
        encryptedBlob,
        iv,
        salt,
        category,
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create secret');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: 'transparent',
    borderColor: '#333',
    color: '#fff',
  } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-md rounded border p-6"
        style={{ background: '#111111', borderColor: '#222222' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-white">Add Secret</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: '#6b7280' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. STRIPE_API_KEY"
              className="w-full px-3 py-2 text-sm rounded border bg-transparent text-white focus:outline-none focus:border-white"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 text-sm rounded border bg-transparent text-white focus:outline-none focus:border-white"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border text-white focus:outline-none focus:border-white"
              style={{ ...inputStyle, background: '#111111' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: '#111111' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>
              Secret Value{' '}
              <span style={{ color: '#10b981' }}>encrypted in browser</span>
            </label>
            <textarea
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder="Paste your secret here"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded border bg-transparent text-white focus:outline-none focus:border-white font-mono resize-none"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>
              Encryption Password{' '}
              <span style={{ color: '#444' }}>never sent to server</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Strong passphrase"
              className="w-full px-3 py-2 text-sm rounded border bg-transparent text-white focus:outline-none focus:border-white"
              style={inputStyle}
              required
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: '#ef4444' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm border rounded"
              style={{ borderColor: '#333', color: '#6b7280' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-sm border rounded font-medium"
              style={{ borderColor: loading ? '#333' : '#fff', color: loading ? '#6b7280' : '#fff' }}
            >
              {loading ? 'Encrypting…' : 'Add Secret'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
