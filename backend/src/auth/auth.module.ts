import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthSeed } from './auth.seed';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthSeed],
})
export class AuthModule {}
