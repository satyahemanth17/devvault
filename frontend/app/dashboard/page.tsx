'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api, type User, type Workspace, type SecretMeta } from '@/lib/api';
import SecretCard from '@/components/SecretCard';
import AddSecretModal from '@/components/AddSecretModal';
import AuditLog from '@/components/AuditLog';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWs, setActiveWs] = useState<Workspace | null>(null);
  const [secrets, setSecrets] = useState<SecretMeta[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showNewWs, setShowNewWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'secrets' | 'audit'>('secrets');

  useEffect(() => {
    const token = localStorage.getItem('devvault_token');
    if (!token) {
      router.replace('/');
      return;
    }

    Promise.all([api.getMe(), api.getWorkspaces()])
      .then(([u, ws]) => {
        setUser(u);
        setWorkspaces(ws);
        if (ws.length > 0) setActiveWs(ws[0]);
      })
      .catch(() => {
        localStorage.removeItem('devvault_token');
        router.replace('/');
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!activeWs) return;
    api.getSecrets(activeWs.id).then(setSecrets).catch(() => {});
  }, [activeWs]);

  async function createWorkspace() {
    if (!newWsName.trim()) return;
    const ws = await api.createWorkspace(newWsName.trim());
    const wsWithRole = { ...ws, role: 'OWNER' as const };
    setWorkspaces((p) => [...p, wsWithRole]);
    setActiveWs(wsWithRole);
    setNewWsName('');
    setShowNewWs(false);
  }

  function handleLogout() {
    localStorage.removeItem('devvault_token');
    router.replace('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Nav */}
      <nav
        className="border-b px-6 py-3 flex items-center justify-between"
        style={{ borderColor: '#222', background: '#111' }}
      >
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span className="font-semibold text-sm text-white">DevVault</span>
        </div>
        <div className="flex items-center gap-4">
          {user?.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full" />
          )}
          <span className="text-sm" style={{ color: '#6b7280' }}>{user?.username}</span>
          <button onClick={handleLogout} className="text-xs" style={{ color: '#6b7280' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-49px)]">
        {/* Sidebar */}
        <aside
          className="w-56 border-r p-4 flex flex-col gap-1 overflow-y-auto"
          style={{ borderColor: '#222', background: '#111' }}
        >
          <div
            className="text-xs font-medium mb-2 uppercase tracking-wider"
            style={{ color: '#6b7280' }}
          >
            Workspaces
          </div>
          {workspaces.map((ws, index) => (
            <motion.button
              key={ws.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05, ease: 'easeOut' }}
              type="button"
              onClick={() => setActiveWs(ws)}
              className="w-full text-left px-3 py-2 rounded text-sm transition-colors"
              style={{
                background: activeWs?.id === ws.id ? '#1a1a1a' : 'transparent',
                color: activeWs?.id === ws.id ? '#fff' : '#6b7280',
                border: `1px solid ${activeWs?.id === ws.id ? '#333' : 'transparent'}`,
              }}
            >
              <div className="truncate">{ws.name}</div>
              <div className="text-xs mt-0.5" style={{ color: '#444' }}>
                {ws.role}
              </div>
            </motion.button>
          ))}

          {showNewWs ? (
            <div className="mt-2">
              <input
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
                placeholder="Workspace name"
                autoFocus
                className="w-full px-2 py-1.5 text-xs rounded border bg-transparent text-white focus:outline-none"
                style={{ borderColor: '#333' }}
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={createWorkspace}
                  className="flex-1 text-xs py-1 rounded border"
                  style={{ borderColor: '#fff', color: '#fff' }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewWs(false)}
                  className="flex-1 text-xs py-1 rounded border"
                  style={{ borderColor: '#333', color: '#6b7280' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewWs(true)}
              className="mt-2 w-full text-left px-3 py-2 text-xs rounded border border-dashed"
              style={{ borderColor: '#333', color: '#6b7280' }}
            >
              + New workspace
            </button>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {!activeWs ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-4">🔐</div>
              <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                Create a workspace to get started
              </p>
              <button
                onClick={() => setShowNewWs(true)}
                className="px-4 py-2 text-sm border rounded"
                style={{ borderColor: '#fff', color: '#fff' }}
              >
                New Workspace
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-lg font-semibold text-white">{activeWs.name}</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                    {secrets.length} secret{secrets.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {(activeWs.role === 'OWNER' || activeWs.role === 'EDITOR') && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="px-4 py-2 text-sm border rounded font-medium"
                    style={{ borderColor: '#fff', color: '#fff' }}
                  >
                    + Add Secret
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 border-b" style={{ borderColor: '#222' }}>
                {(['secrets', 'audit'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="px-4 py-2 text-sm capitalize transition-colors"
                    style={{
                      color: tab === t ? '#fff' : '#6b7280',
                      borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent',
                      marginBottom: '-1px',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === 'secrets' && (
                secrets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                      No secrets yet. Add one to get started.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {secrets.map((s) => (
                      <SecretCard
                        key={s.id}
                        secret={s}
                        workspaceId={activeWs.id}
                        onDelete={() => api.getSecrets(activeWs.id).then(setSecrets).catch(() => {})}
                      />
                    ))}
                  </div>
                )
              )}

              {tab === 'audit' && <AuditLog workspaceId={activeWs.id} />}
            </>
          )}
        </main>
      </div>

      {showAdd && activeWs && (
        <AddSecretModal
          workspaceId={activeWs.id}
          onClose={() => setShowAdd(false)}
          onAdded={() => api.getSecrets(activeWs.id).then(setSecrets)}
        />
      )}
    </div>
  );
}
