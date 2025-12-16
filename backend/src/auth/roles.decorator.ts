import { SetMetadata } from '@nestjs/common';

export type AppRole = 'ADMIN' | 'FAMILIA';

export const Roles = (...roles: AppRole[]) => SetMetadata('roles', roles);
