import { Injectable } from '@nestjs/common';

import { DatabaseService, IDatabaseUnitOfWorkInterface } from '../../database/database.service';
import { User } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { AuthRole } from './../entities/AuthRole.entity';
import { AuthRoleBasicModel } from './../entities/roles';
import { AuthRoles } from './../entities/roles';
import { AuthRoleAlreadyExistsAuthError } from './../errors/AuthError';

@Injectable()
export class AuthRolesService {
  constructor(private readonly databaseService: DatabaseService, private readonly usersService: UsersService) {}

  async findAll(duow?: IDatabaseUnitOfWorkInterface): Promise<AuthRole[]> {
    const repository = await this.databaseService.getRepository<AuthRole>(AuthRole, duow);
    return repository.find();
  }

  async find(query, duow?: IDatabaseUnitOfWorkInterface): Promise<AuthRole[]> {
    const repository = await this.databaseService.getRepository<AuthRole>(AuthRole, duow);
    return repository.find(query);
  }

  async findOne(query, duow?: IDatabaseUnitOfWorkInterface): Promise<AuthRole> {
    const repository = await this.databaseService.getRepository<AuthRole>(AuthRole, duow);
    return repository.findOne(query);
  }

  async create(authRole: AuthRole, duow?: IDatabaseUnitOfWorkInterface): Promise<AuthRole> {
    const repository = await this.databaseService.getRepository<AuthRole>(AuthRole, duow);
    const authRoleAlreadyExists = await repository.findOne({
      where: {
        code: authRole.code,
      },
    });
    if (authRoleAlreadyExists) throw new AuthRoleAlreadyExistsAuthError();
    return repository.save(authRole);
  }

  async update(authRole: AuthRole, duow?: IDatabaseUnitOfWorkInterface): Promise<AuthRole> {
    const repository = await this.databaseService.getRepository<AuthRole>(AuthRole, duow);
    await repository.update(
      {
        code: authRole.code,
      },
      {
        ...authRole,
      },
    );
    return repository.findOne(authRole.code);
  }

  /**
   * Adds a new role to a user
   * @param user
   * @param permission
   * @returns role AuthRole
   */
  async addRole(
    user: User,
    role: AuthRole | AuthRoleBasicModel,
    duow?: IDatabaseUnitOfWorkInterface,
  ): Promise<AuthRole> {
    if ((role as AuthRoleBasicModel).definition) {
      role = await this.findOne(
        {
          where: {
            code: role.code,
          },
        },
        duow,
      );
    }
    const hasRole = (user.auth_roles || []).includes(role as AuthRole);
    if (!hasRole) {
      user.auth_roles = user.auth_roles || [];
      user.auth_roles.push(role as AuthRole);
      await this.usersService.save(user, duow);
    }
    return role as AuthRole;
  }

  /**
   * Removes a role from a user
   * @param user
   * @param role
   */
  async removeRole(user: User, role: AuthRole | AuthRoleBasicModel, duow?: IDatabaseUnitOfWorkInterface) {
    if ((role as AuthRoleBasicModel).definition) {
      role = await this.findOne(
        {
          where: {
            code: role.code,
          },
        },
        duow,
      );
    }
    const hasRole = (user.auth_roles || []).includes(role as AuthRole);
    if (hasRole) {
      user.auth_roles.splice(user.auth_roles.indexOf(role as AuthRole), 1);
      await this.usersService.save(user, duow);
    }
  }

  /**
   * Returns a role by its code inside a role object definition
   * @param role
   * @param duow
   */
  async readRoleByDefinition(role: AuthRoleBasicModel, duow?: IDatabaseUnitOfWorkInterface): Promise<AuthRole> {
    const p = await this.findOne(
      {
        where: {
          code: role.code,
        },
      },
      duow,
    );
    return p;
  }

  async loadRoles() {
    Object.values(AuthRoles).forEach(async role => {
      const repository = await this.databaseService.getRepository(AuthRole);
      let r = await repository.findOne({
        where: {
          code: role.code,
        },
      });
      if (!r) {
        r = await repository.save(repository.create(role));
      }
    });
  }
}
