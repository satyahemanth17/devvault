'use client';

import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#0a0a0a' }}
    >
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2" />
          </svg>
          <span className="text-3xl font-bold tracking-tight text-white">DevVault</span>
        </div>
        <p className="text-lg max-w-md mx-auto leading-relaxed" style={{ color: '#6b7280' }}>
          Zero-knowledge secrets management. AES-256-GCM encryption happens in your browser —
          the server never sees your secrets.
        </p>
      </div>

      <motion.a
        href="http://localhost:5002/api/auth/github"
        className="flex items-center gap-3 px-6 py-3 bg-white text-black font-semibold rounded border border-white hover:bg-gray-100 transition-colors cursor-pointer"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
        Continue with GitHub
      </motion.a>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-2xl w-full">
        {[
          { icon: '🔐', title: 'AES-256-GCM', desc: 'Browser-side encryption before transmission' },
          { icon: '🛡️', title: 'RBAC', desc: 'Owner, Editor, Viewer access control' },
          { icon: '📋', title: 'Audit Log', desc: 'Tamper-evident, insert-only access history' },
        ].map((f) => (
          <div
            key={f.title}
            className="p-4 border rounded"
            style={{ background: '#111111', borderColor: '#222222' }}
          >
            <div className="text-xl mb-2">{f.icon}</div>
            <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
            <div className="text-xs" style={{ color: '#6b7280' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
