import { Module } from '@nestjs/common';
import { AyudasController } from './ayudas.controller';
import { AyudasService } from './ayudas.service';

@Module({
  controllers: [AyudasController],
  providers: [AyudasService]
})
export class AyudasModule {}
