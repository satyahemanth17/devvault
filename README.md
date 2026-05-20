# DevVault

Zero-knowledge secrets management platform. AES-256-GCM encryption runs entirely in the browser — the server stores only ciphertext and never sees plaintext secrets.

## Zero-Knowledge Architecture

```
Browser                           Server
──────                            ──────
secretValue ──PBKDF2(100k)──►  derives key
                                  │
                     AES-256-GCM encrypt
                                  │
encryptedBlob ◄───────────────────┘
iv
salt
                ── POST /api/secrets ──►  stores { encryptedBlob, iv, salt }
                                          plaintext NEVER touches the server

To decrypt:
                ◄── GET /api/secrets/:id ── { encryptedBlob, iv, salt }
password ──────────────────────────────►  PBKDF2 → AES-GCM decrypt → plaintext
```

**The server cannot read your secrets even if compromised.**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Encryption | Web Crypto API — AES-256-GCM, PBKDF2 (100k iterations) |
| Backend | Node.js, Express.js, TypeScript |
| ORM | Prisma with PostgreSQL |
| Auth | GitHub OAuth 2.0 + JWT |
| Container | Docker + Docker Compose |

## Features

- **AES-256-GCM** — authenticated encryption with unique IV per secret
- **PBKDF2** — 100,000 iterations, SHA-256, per-secret random salt
- **RBAC** — Owner / Editor / Viewer roles per workspace
- **Immutable Audit Log** — INSERT-only, records every access with IP + user agent
- **Secret Rotation** — atomic `$transaction([deactivate old, create new version])`
- **Workspaces** — multi-tenant isolation

## Quick Start

### Local development

```bash
# Backend
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, GitHub OAuth
npm install
npx prisma db push
npx ts-node-dev --respawn src/app.ts   # http://localhost:5002

# Frontend (separate terminal)
cd frontend
npm install
npm run dev            # http://localhost:3002
```

### Docker

```bash
# Copy backend .env for credentials
cp backend/.env.example backend/.env   # fill in JWT_SECRET, GitHub credentials

docker-compose up --build
# Backend: http://localhost:5002
# Frontend: run separately with npm run dev
```

## API Reference

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/health` | — | — | Health check |
| `GET` | `/api/auth/github` | — | — | Initiate GitHub OAuth |
| `GET` | `/api/auth/github/callback` | — | — | OAuth callback, issues JWT |
| `GET` | `/api/auth/me` | JWT | — | Current user |
| `GET` | `/api/workspaces` | JWT | — | List user's workspaces |
| `POST` | `/api/workspaces` | JWT | — | Create workspace |
| `GET` | `/api/workspaces/:id/secrets` | JWT | VIEWER | List secrets (metadata only) |
| `POST` | `/api/workspaces/:id/secrets` | JWT | EDITOR | Store encrypted secret |
| `GET` | `/api/workspaces/:id/secrets/:sid` | JWT | VIEWER | Fetch encrypted blob |
| `DELETE` | `/api/workspaces/:id/secrets/:sid` | JWT | EDITOR | Soft-delete secret |
| `POST` | `/api/workspaces/:id/secrets/:sid/rotate` | JWT | EDITOR | Atomic secret rotation |
| `GET` | `/api/workspaces/:id/audit` | JWT | VIEWER | Paginated audit log |

## Security Properties

- `crypto.ts` is `'use client'` — enforced browser-only execution
- Salt (16 bytes) and IV (12 bytes) are random per secret, stored alongside ciphertext
- AuditLog is INSERT-ONLY — no UPDATE or DELETE operations
- RBAC enforced server-side on every route
- JWT expiry: 7 days

## Ports

| Service | Port |
|---------|------|
| Frontend | 3002 |
| Backend | 5002 |
| PostgreSQL | 5432 |
