import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComunidadDto } from './dto/create-comunidad.dto';

@Injectable()
export class ComunidadesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateComunidadDto) {
    return this.prisma.comunidad.create({
      data,
    });
  }

  findAll() {
    return this.prisma.comunidad.findMany({
      orderBy: { id: 'asc' },
    });
  }
}
