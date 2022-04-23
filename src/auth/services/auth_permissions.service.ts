import { Injectable } from '@nestjs/common';

import { DatabaseService, IDatabaseUnitOfWorkInterface } from '../../database/database.service';
import { User } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { AuthPermission } from './../entities/AuthPermission.entity';
import { AuthPermissionBasicModel } from './../entities/permissions';
import { AuthPermissions } from './../entities/permissions';
import { AuthPermissionAlreadyExistsAuthError } from './../errors/AuthError';

@Injectable()
export class AuthPermissionsService {
  constructor(private readonly databaseService: DatabaseService, private readonly usersService: UsersService) {}

  /**
   * Common service methods
   *
   */
  async findAll(duow?: IDatabaseUnitOfWorkInterface): Promise<AuthPermission[]> {
    const repository = await this.databaseService.getRepository<AuthPermission>(AuthPermission, duow);
    return repository.find();
  }

  async find(query, duow?: IDatabaseUnitOfWorkInterface): Promise<AuthPermission[]> {
    const repository = await this.databaseService.getRepository<AuthPermission>(AuthPermission, duow);
    return repository.find(query);
  }

  async findOne(query, duow?: IDatabaseUnitOfWorkInterface): Promise<AuthPermission> {
    const repository = await this.databaseService.getRepository<AuthPermission>(AuthPermission, duow);
    return repository.findOne(query);
  }

  async create(authPermission: AuthPermission, duow?: IDatabaseUnitOfWorkInterface): Promise<AuthPermission> {
    const repository = await this.databaseService.getRepository<AuthPermission>(AuthPermission, duow);
    const authPermissionAlreadyExists = await repository.findOne({
      where: {
        code: authPermission.code,
      },
    });
    if (authPermissionAlreadyExists) throw new AuthPermissionAlreadyExistsAuthError();
    return repository.save(authPermission);
  }

  async update(authPermission: AuthPermission, duow?: IDatabaseUnitOfWorkInterface): Promise<AuthPermission> {
    const repository = await this.databaseService.getRepository<AuthPermission>(AuthPermission, duow);
    await repository.update(
      {
        code: authPermission.code,
      },
      {
        ...authPermission,
      },
    );
    return repository.findOne(authPermission.code);
  }

  /**
   * Adds a new permission to a user
   * @param user
   * @param permission
   */
  async addPermission(
    user: User,
    permission: AuthPermission | AuthPermissionBasicModel,
    duow?: IDatabaseUnitOfWorkInterface,
  ) {
    if ((permission as AuthPermissionBasicModel).definition) {
      permission = await this.findOne(
        {
          where: {
            code: permission.code,
          },
        },
        duow,
      );
    }
    const hasPermission = (user.auth_permissions || []).includes(permission as AuthPermission);
    if (!hasPermission) {
      user.auth_permissions = user.auth_permissions || [];
      user.auth_permissions.push(permission as AuthPermission);
      await this.usersService.save(user, duow);
    }
  }

  /**
   * Removes a permission from a user
   * @param user
   * @param permission
   */
  async removePermission(
    user: User,
    permission: AuthPermission | AuthPermissionBasicModel,
    duow?: IDatabaseUnitOfWorkInterface,
  ) {
    if ((permission as AuthPermissionBasicModel).definition) {
      permission = await this.findOne(
        {
          where: {
            code: permission.code,
          },
        },
        duow,
      );
    }
    const hasPermission = (user.auth_permissions || []).includes(permission as AuthPermission);
    if (hasPermission) {
      user.auth_permissions.splice(user.auth_permissions.indexOf(permission as AuthPermission), 1);
      await this.usersService.save(user, duow);
    }
  }

  /**
   * Returns a permission by its code inside a permission object definition
   * @param permission
   * @param duow
   */
  async readPermissionByDefinition(permission: AuthPermissionBasicModel, duow?: IDatabaseUnitOfWorkInterface) {
    const p = await this.findOne(
      {
        where: {
          code: permission.code,
        },
      },
      duow,
    );
    return p;
  }

  async loadPermissions() {
    Object.values(AuthPermissions).forEach(async permission => {
      const repository = await this.databaseService.getRepository(AuthPermission);
      let r = await repository.findOne({
        where: {
          code: permission.code,
        },
      });
      if (!r) {
        r = await repository.save(repository.create(permission));
      }
    });
  }
}
