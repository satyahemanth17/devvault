import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

router.get('/', authenticateToken, requireRole(Role.VIEWER), async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where: { workspaceId },
      include: { actor: { select: { username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where: { workspaceId } }),
  ]);

  res.json({ logs, total, limit, offset });
});

export default router;
