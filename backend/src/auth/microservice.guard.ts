import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

// Permite que el microservicio reporte progreso usando un API key simple en header
@Injectable()
export class MicroserviceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'] as string | undefined;
    const expected = process.env.MICRO_API_KEY;
    if (!expected) {
      throw new UnauthorizedException('MICRO_API_KEY no configurada');
    }
    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException('API key inválida');
    }
    return true;
  }
}
