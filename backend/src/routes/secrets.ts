import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createAuditLog } from '../utils/audit';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

router.get('/', authenticateToken, requireRole(Role.VIEWER), async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const secrets = await prisma.secret.findMany({
    where: { workspaceId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      version: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      ownerId: true,
    },
  });

  await createAuditLog({
    actorId: req.user!.userId,
    workspaceId,
    action: 'SECRET_READ',
    metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
  });

  res.json(secrets);
});

router.post('/', authenticateToken, requireRole(Role.EDITOR), async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { name, description, encryptedBlob, iv, salt, category, expiresAt } = req.body as {
    name: string;
    description?: string;
    encryptedBlob: string;
    iv: string;
    salt: string;
    category?: string;
    expiresAt?: string;
  };

  if (!encryptedBlob || !iv || !salt) {
    res.status(400).json({ error: 'encryptedBlob, iv, and salt are required' });
    return;
  }

  const secret = await prisma.secret.create({
    data: {
      name,
      description,
      encryptedBlob,
      iv,
      salt,
      category: category ?? 'general',
      ownerId: req.user!.userId,
      workspaceId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    },
  });

  await createAuditLog({
    actorId: req.user!.userId,
    workspaceId,
    action: 'SECRET_CREATED',
    secretId: secret.id,
    metadata: { name, category, ip: req.ip, userAgent: req.headers['user-agent'] },
  });

  res.status(201).json({
    id: secret.id,
    name: secret.name,
    description: secret.description,
    category: secret.category,
    version: secret.version,
    createdAt: secret.createdAt,
  });
});

router.get('/:secretId', authenticateToken, requireRole(Role.VIEWER), async (req: Request, res: Response) => {
  const { workspaceId, secretId } = req.params;

  const secret = await prisma.secret.findFirst({
    where: { id: secretId, workspaceId, isActive: true },
  });

  if (!secret) {
    res.status(404).json({ error: 'Secret not found' });
    return;
  }

  await createAuditLog({
    actorId: req.user!.userId,
    workspaceId,
    action: 'SECRET_READ',
    secretId,
    metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
  });

  res.json(secret);
});

router.delete('/:secretId', authenticateToken, requireRole(Role.EDITOR), async (req: Request, res: Response) => {
  const { workspaceId, secretId } = req.params;

  await prisma.secret.update({
    where: { id: secretId },
    data: { isActive: false },
  });

  await createAuditLog({
    actorId: req.user!.userId,
    workspaceId,
    action: 'SECRET_DELETED',
    secretId,
    metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
  });

  res.status(204).send();
});

router.post('/:secretId/rotate', authenticateToken, requireRole(Role.EDITOR), async (req: Request, res: Response) => {
  const { workspaceId, secretId } = req.params;
  const { encryptedBlob, iv, salt } = req.body as {
    encryptedBlob: string;
    iv: string;
    salt: string;
  };

  if (!encryptedBlob || !iv || !salt) {
    res.status(400).json({ error: 'encryptedBlob, iv, and salt are required for rotation' });
    return;
  }

  const old = await prisma.secret.findFirst({ where: { id: secretId, workspaceId, isActive: true } });
  if (!old) {
    res.status(404).json({ error: 'Secret not found' });
    return;
  }

  const newSecret = await prisma.$transaction([
    prisma.secret.update({ where: { id: secretId }, data: { isActive: false } }),
    prisma.secret.create({
      data: {
        name: old.name,
        description: old.description,
        encryptedBlob,
        iv,
        salt,
        category: old.category,
        ownerId: req.user!.userId,
        workspaceId,
        version: old.version + 1,
      },
    }),
  ]);

  await createAuditLog({
    actorId: req.user!.userId,
    workspaceId,
    action: 'SECRET_ROTATED',
    secretId: newSecret[1].id,
    metadata: { previousVersion: old.version, newVersion: old.version + 1, ip: req.ip },
  });

  res.status(201).json({ id: newSecret[1].id, version: newSecret[1].version });
});

export default router;
