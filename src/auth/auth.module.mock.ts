import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'nestjs-redis';

import { jwtServiceMock } from '../common/mocks/jwt.service.mock';
import { redisServiceMock } from '../common/mocks/redis.service.mock';
import { DatabaseService } from '../database/database.service';
import { DatabaseServiceMock } from '../database/database.service.mock';
import { UsersService } from '../users/users.service';
import { usersServiceMock } from '../users/users.service.mock';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { AuthEmailService } from './services/auth_email.service';
import { authEmailServiceMock } from './services/auth_email.service.mock';
import { AuthPermissionsService } from './services/auth_permissions.service';
import { authPermissionsServiceMock } from './services/auth_permissions.service.mock';
import { AuthRolesService } from './services/auth_roles.service';
import { authRolesServiceMock } from './services/auth_roles.service.mock';
import { AuthService } from './services/auth.service';

@Module({
  imports: [],
  providers: [
    {
      provide: UsersService,
      useValue: usersServiceMock,
    },
    {
      provide: JwtService,
      useValue: jwtServiceMock,
    },
    {
      provide: RedisService,
      useValue: redisServiceMock,
    },
    {
      provide: DatabaseService,
      useClass: DatabaseServiceMock,
    },
    AuthService,
    {
      provide: AuthRolesService,
      useValue: authRolesServiceMock,
    },
    {
      provide: AuthPermissionsService,
      useValue: authPermissionsServiceMock,
    },
    {
      provide: ConfigService,
      useValue: {
        get: jest.fn(),
      },
    },
    {
      provide: AuthEmailService,
      useValue: authEmailServiceMock,
    },
    LocalStrategy,
    JwtStrategy,
    AuthResolver,
  ],
  exports: [AuthService],
})
export class AuthModuleMock {}
