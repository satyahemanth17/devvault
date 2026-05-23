# DevVault — Frontend

Next.js 14 frontend for DevVault, a zero-knowledge secrets management platform.

## What This Is

The frontend handles all encryption. Secrets are encrypted with AES-256-GCM in the browser using the Web Crypto API before being sent to the backend. The server only ever stores ciphertext — it cannot read your secrets.

## Tech Stack

| | |
|-|-|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Encryption | Web Crypto API — AES-256-GCM + PBKDF2 |

## Structure

```
app/
  page.tsx              # Landing page + GitHub OAuth login
  dashboard/page.tsx    # Main app — workspaces, secrets, audit log
components/
  SecretCard.tsx        # Per-secret card with reveal / rotate / delete
  AddSecretModal.tsx    # Modal to add a new secret (encrypts in browser)
  AuditLog.tsx          # Paginated audit log table
lib/
  crypto.ts             # AES-256-GCM encrypt/decrypt (browser only, 'use client')
  api.ts                # Typed API client
```

## Running Locally

Requires the backend running at `http://localhost:5002`.

```bash
npm install
npm run dev   # http://localhost:3002
```

## Encryption Flow

`crypto.ts` is `'use client'` — it runs exclusively in the browser.

```
encrypt(secretValue, password):
  1. PBKDF2(password, randomSalt, 100_000 iterations, SHA-256) → key
  2. AES-256-GCM(key, randomIV, secretValue) → encryptedBlob
  3. POST { encryptedBlob, iv, salt } to backend

decrypt(encryptedBlob, iv, salt, password):
  1. PBKDF2(password, salt, 100_000 iterations, SHA-256) → key
  2. AES-256-GCM decrypt(key, iv, encryptedBlob) → plaintext
  3. Displayed for 30 seconds, then auto-cleared
```

The server never receives `secretValue` or `password` under any circumstance.

## Design System

- Background: `#0a0a0a`, Surface: `#111111`, Border: `#222222`
- Accent: `#10b981` (emerald), Danger: `#ef4444`
- Font: Inter, system-ui fallback
- Style: minimal, monochrome, HashiCorp/Vault aesthetic
