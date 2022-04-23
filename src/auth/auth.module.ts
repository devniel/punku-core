import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import debug from 'debug';

import { DatabaseService } from '../database/database.service';
import { UsersModule } from '../users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthPermission } from './entities/AuthPermission.entity';
import { AuthRole } from './entities/AuthRole.entity';
import { AuthPermissions } from './entities/permissions';
import { AuthRoles } from './entities/roles';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { AuthEmailService } from './services/auth_email.service';
import { AuthPermissionsService } from './services/auth_permissions.service';
import { AuthRolesService } from './services/auth_roles.service';
import { AuthService } from './services/auth.service';

const log = debug('app:AuthModule');

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    ConfigService,
    DatabaseService,
    AuthService,
    AuthRolesService,
    AuthPermissionsService,
    AuthEmailService,
    AuthResolver,
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  constructor(private databaseService: DatabaseService) {}

  async onModuleInit() {
    log('onModuleInit() - loading roles and permissions ⚙');
    // Load roles
    await Promise.all(
      Object.values(AuthRoles).map(async role => {
        const repository = await this.databaseService.getRepository(AuthRole);
        let r = await repository.findOne({
          where: {
            code: role.code,
          },
        });
        if (!r) {
          r = await repository.save(repository.create(role));
        }
      }),
    );
    log('onModuleInit() - loaded roles ✅');
    // Load permissions
    await Promise.all(
      Object.values(AuthPermissions).map(async permission => {
        const repository = await this.databaseService.getRepository(AuthPermission);
        let r = await repository.findOne({
          where: {
            code: permission.code,
          },
        });
        if (!r) {
          r = await repository.save(repository.create(permission));
        }
      }),
    );
    log('onModuleInit() - loaded permissions ✅');
  }
}
