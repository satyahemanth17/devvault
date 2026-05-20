import { PrismaClient, AuditAction, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditParams {
  actorId: string;
  workspaceId: string;
  action: AuditAction;
  secretId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      workspaceId: params.workspaceId,
      action: params.action,
      secretId: params.secretId,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
