import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import workspacesRouter from './routes/workspaces';
import secretsRouter from './routes/secrets';
import auditRouter from './routes/audit';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5002;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3002', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/workspaces/:workspaceId/secrets', secretsRouter);
app.use('/api/workspaces/:workspaceId/audit', auditRouter);

app.listen(PORT, () => {
  console.log(`DevVault backend listening on port ${PORT}`);
  const clientId = process.env.GITHUB_CLIENT_ID;
  console.log(`GitHub OAuth client_id: ${clientId ? clientId.slice(0, 4) + '...' : 'MISSING'}`);
});

export default app;
