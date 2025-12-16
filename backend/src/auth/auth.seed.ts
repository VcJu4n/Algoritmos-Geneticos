import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hash } from 'bcryptjs';

@Injectable()
export class AuthSeed implements OnModuleInit {
  private readonly logger = new Logger(AuthSeed.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) return;

    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@ayni.com';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';

    const pwdHash = await hash(password, 10);
    await this.prisma.user.create({
      data: {
        email,
        password: pwdHash,
        role: 'ADMIN',
      },
    });

    this.logger.warn(
      `Admin creado por defecto: ${email}. Cambia DEFAULT_ADMIN_EMAIL/DEFAULT_ADMIN_PASSWORD en .env después de iniciar.`,
    );
  }
}
