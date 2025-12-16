import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify, type JwtPayload as LibJwtPayload } from 'jsonwebtoken';
import type { AppRole } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

type JwtPayload = LibJwtPayload & {
  role: AppRole;
  familiaId?: number;
  email?: string;
};

// Guard simple que exige un Bearer token y adjunta el payload en req.user
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = auth.slice('Bearer '.length);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Missing JWT secret');
    }
    try {
      const decoded = verify(token, secret);
      if (!decoded || typeof decoded !== 'object' || !('role' in decoded)) {
        throw new UnauthorizedException('Invalid token payload');
      }
      req.user = decoded as JwtPayload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
