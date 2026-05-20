import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const roleHierarchy: Record<Role, number> = {
  OWNER: 3,
  EDITOR: 2,
  VIEWER: 1,
};

export function requireRole(minimumRole: Role) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    const workspaceId = req.params.workspaceId || req.body.workspaceId;

    if (!userId || !workspaceId) {
      res.status(400).json({ error: 'Missing userId or workspaceId' });
      return;
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!member) {
      res.status(403).json({ error: 'Not a workspace member' });
      return;
    }

    if (roleHierarchy[member.role] < roleHierarchy[minimumRole]) {
      res.status(403).json({ error: `Requires ${minimumRole} role or higher` });
      return;
    }

    next();
  };
}
