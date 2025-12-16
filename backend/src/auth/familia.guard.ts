import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Limita acceso a la propia familia salvo que el rol sea ADMIN
@Injectable()
export class FamiliaGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (user?.role === 'ADMIN') return true;
    const paramId = req.params?.id
      ? Number(req.params.id)
      : req.query?.familiaId
        ? Number(req.query.familiaId)
        : req.body?.familiaId
          ? Number(req.body.familiaId)
          : undefined;
    if (!user?.familiaId) {
      // fallback: intentar cargar familiaId desde BD usando sub
      if (user?.sub) {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: user.sub },
          select: { familiaId: true },
        });
        if (dbUser?.familiaId) {
          req.user.familiaId = dbUser.familiaId;
        }
      }
      if (!req.user?.familiaId) {
        throw new ForbiddenException('Solo tu familia');
      }
    }
    if (paramId && req.user.familiaId !== paramId) {
      throw new ForbiddenException('Solo tu familia');
    }
    return true;
  }
}
