import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamiliaDto } from './dto/create-familia.dto';

@Injectable()
export class FamiliasService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateFamiliaDto) {
    return this.prisma.familia.create({
      data,
    });
  }

  findAll() {
    return this.prisma.familia.findMany({
      include: {
        comunidad: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.familia.findUnique({
      where: { id },
      include: { comunidad: true },
    });
  }

  findByComunidad(comunidadId: number) {
    return this.prisma.familia.findMany({
      where: { comunidadId },
      include: { comunidad: true },
      orderBy: { id: 'asc' },
    });
  }
}
