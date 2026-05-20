import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createAuditLog } from '../utils/audit';

const router = Router();
const prisma = new PrismaClient();

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string };
  const userId = req.user!.userId;

  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({ data: { name, description } });
    await tx.workspaceMember.create({
      data: { userId, workspaceId: ws.id, role: Role.OWNER },
    });
    return ws;
  });

  await createAuditLog({
    actorId: userId,
    workspaceId: workspace.id,
    action: 'WORKSPACE_CREATED',
    metadata: { name },
  });

  res.status(201).json(workspace);
});

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
  });
  res.json(memberships.map((m) => ({ ...m.workspace, role: m.role })));
});

router.get('/:workspaceId', authenticateToken, requireRole(Role.VIEWER), async (req: Request, res: Response) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: req.params.workspaceId },
    include: { members: { include: { user: true } } },
  });
  res.json(workspace);
});

router.post('/:workspaceId/members', authenticateToken, requireRole(Role.OWNER), async (req: Request, res: Response) => {
  const { userId: targetUserId, role } = req.body as { userId: string; role: Role };
  const { workspaceId } = req.params;

  const member = await prisma.workspaceMember.create({
    data: { userId: targetUserId, workspaceId, role: role ?? Role.VIEWER },
  });

  await createAuditLog({
    actorId: req.user!.userId,
    workspaceId,
    action: 'MEMBER_ADDED',
    metadata: { targetUserId, role },
  });

  res.status(201).json(member);
});

router.patch('/:workspaceId/members/:memberId', authenticateToken, requireRole(Role.OWNER), async (req: Request, res: Response) => {
  const { role } = req.body as { role: Role };
  const { workspaceId, memberId } = req.params;

  const updated = await prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId: memberId, workspaceId } },
    data: { role },
  });

  await createAuditLog({
    actorId: req.user!.userId,
    workspaceId,
    action: 'MEMBER_ROLE_CHANGED',
    metadata: { memberId, newRole: role },
  });

  res.json(updated);
});

export default router;
