import { Injectable } from '@nestjs/common';
import { FindOneOptions } from 'typeorm';

import { AuthPermission } from '../auth/entities/AuthPermission.entity';
import { DatabaseService, IDatabaseUnitOfWorkInterface } from '../database/database.service';
import { EmailAlreadyExistsUsersError, UsernameAlreadyExistsUsersError } from './errors/UserError';
import { User, UserModel, UserUpdateModel } from './user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query?, duow?: IDatabaseUnitOfWorkInterface): Promise<User[]> {
    const repository = await this.databaseService.getRepository<User>(User, duow);
    return repository.find(query);
  }

  async find(query, duow?: IDatabaseUnitOfWorkInterface): Promise<User[]> {
    const repository = await this.databaseService.getRepository<User>(User, duow);
    return repository.find(query);
  }

  async findOne(query: FindOneOptions, duow?: IDatabaseUnitOfWorkInterface): Promise<User> {
    const repository = await this.databaseService.getRepository<User>(User, duow);
    return repository.findOne(query);
  }

  async create(user: UserModel, duow?: IDatabaseUnitOfWorkInterface): Promise<User> {
    const repository = await this.databaseService.getRepository<User>(User, duow);
    const usernameAlreadyExists = await repository.findOne({
      where: {
        username: user.username,
      },
    });
    if (usernameAlreadyExists) throw new UsernameAlreadyExistsUsersError();
    const emailAlreadyExists = await repository.findOne({
      where: {
        email: user.email,
      },
    });
    if (emailAlreadyExists) throw new EmailAlreadyExistsUsersError();
    return repository.save(user);
  }

  async save(user: User, duow?: IDatabaseUnitOfWorkInterface): Promise<User> {
    const repository = await this.databaseService.getRepository<User>(User, duow);
    return repository.save(user);
  }

  async update(user: User, updates: UserUpdateModel, duow?: IDatabaseUnitOfWorkInterface): Promise<User> {
    const repository = await this.databaseService.getRepository<User>(User, duow);
    await repository.update(user.id, {
      ...updates,
    });
    return repository.findOne(user.id);
  }

  async isAuthorized(user: User, permission: AuthPermission): Promise<boolean> {
    const repository = await this.databaseService.getRepository<User>(User);
    const _user = await repository.findOne({
      where: {
        email: user.email,
      },
    });
    const authorized = _user.auth_permissions.some(ap => ap.id === permission.id);
    return authorized;
  }
}
