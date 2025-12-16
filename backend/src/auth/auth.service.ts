import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterFamilyDto } from './dto/register-family.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import type { AppRole } from './roles.decorator';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private async signToken(payload: {
    sub: number;
    role: AppRole;
    familiaId?: number;
    email: string;
  }) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new BadRequestException('JWT secret missing');
    return sign(payload, secret, { expiresIn: '1d' });
  }

  async registerFamily(dto: RegisterFamilyDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('Email ya existe');

    let comunidadId = dto.comunidadId ?? null;
    if (!comunidadId) {
      if (!dto.comunidadNombre || !dto.comunidadRegion) {
        throw new BadRequestException('Debe indicar comunidad existente o nombre y región para crear una nueva.');
      }
    } else {
      const comunidad = await this.prisma.comunidad.findUnique({ where: { id: comunidadId } });
      if (!comunidad) throw new BadRequestException('Comunidad no encontrada');
    }

    const pwdHash = await hash(dto.password, 10);
    const { familia, user } = await this.prisma.$transaction(async (tx) => {
      const comunidadSeleccionada =
        comunidadId ??
        (
          await tx.comunidad.create({
            data: {
              nombre: dto.comunidadNombre!,
              region: dto.comunidadRegion!,
            },
          })
        ).id;
      const nuevaFamilia = await tx.familia.create({
        data: {
          nombre: dto.nombreFamilia,
          comunidadId: comunidadSeleccionada,
          miembros: dto.miembros,
        },
      });
      const nuevoUser = await tx.user.create({
        data: {
          email: dto.email,
          password: pwdHash,
          role: 'FAMILIA',
          familiaId: nuevaFamilia.id,
        },
      });
      return { familia: nuevaFamilia, user: nuevoUser };
    });

    const token = await this.signToken({
      sub: user.id,
      role: 'FAMILIA',
      familiaId: familia.id,
      email: user.email,
    });
    return { token, role: user.role, familiaId: familia.id };
  }

  async registerAdmin(dto: RegisterAdminDto) {
    const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
      throw new BadRequestException('Ya existe un admin');
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('Email ya existe');
    const pwdHash = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: pwdHash,
        role: 'ADMIN',
      },
    });
    const token = await this.signToken({
      sub: user.id,
      role: 'ADMIN',
      email: user.email,
    });
    return { token, role: user.role };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('Credenciales incorrectas');
    const ok = await compare(dto.password, user.password);
    if (!ok) throw new BadRequestException('Credenciales incorrectas');
    const token = await this.signToken({
      sub: user.id,
      role: user.role as AppRole,
      familiaId: user.familiaId ?? undefined,
      email: user.email,
    });
    return { token, role: user.role, familiaId: user.familiaId ?? null };
  }
}
