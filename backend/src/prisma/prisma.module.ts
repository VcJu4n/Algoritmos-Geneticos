import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Para poder usar PrismaService en cualquier módulo sin reimportar
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
