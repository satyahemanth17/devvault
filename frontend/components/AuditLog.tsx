'use client';

import { useEffect, useState } from 'react';
import { api, type AuditEntry } from '@/lib/api';

const ACTION_COLORS: Record<string, string> = {
  SECRET_CREATED: '#10b981',
  SECRET_READ: '#6b7280',
  SECRET_DELETED: '#ef4444',
  SECRET_ROTATED: '#f59e0b',
  WORKSPACE_CREATED: '#3b82f6',
  MEMBER_ADDED: '#8b5cf6',
  MEMBER_REMOVED: '#ef4444',
  MEMBER_ROLE_CHANGED: '#f59e0b',
};

export default function AuditLog({ workspaceId }: { workspaceId: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAuditLog(workspaceId)
      .then((r) => {
        setLogs(r.logs);
        setTotal(r.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: '#6b7280' }}>
        Loading audit log…
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Audit Log</h3>
        <span className="text-xs" style={{ color: '#6b7280' }}>
          {total} events
        </span>
      </div>
      <div className="border rounded overflow-hidden" style={{ borderColor: '#222' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#111', borderBottom: '1px solid #222' }}>
              <th className="text-left px-4 py-2 font-medium" style={{ color: '#6b7280' }}>Action</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: '#6b7280' }}>Actor</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: '#6b7280' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center" style={{ color: '#6b7280' }}>
                  No audit events yet
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{ borderBottom: i < logs.length - 1 ? '1px solid #1a1a1a' : undefined }}
                >
                  <td
                    className="px-4 py-2 font-mono"
                    style={{ color: ACTION_COLORS[log.action] ?? '#6b7280' }}
                  >
                    {log.action}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {log.actor.avatarUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={log.actor.avatarUrl}
                          alt=""
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span style={{ color: '#d1d5db' }}>{log.actor.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2" style={{ color: '#6b7280' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
