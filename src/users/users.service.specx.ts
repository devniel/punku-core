import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';
import { getConnection, Repository } from 'typeorm';

import { AuthPermissions } from '../auth/entities/permissions';
import { AuthRoles } from '../auth/entities/roles';
import { AuthPermissionsService } from '../auth/services/auth_permissions.service';
import { AuthRolesService } from '../auth/services/auth_roles.service';
import { DatabaseModule } from '../database';
import { DatabaseService } from '../database/database.service';
import { DatabaseServiceMock } from '../database/database.service.mock';
import { MockType } from '../shared/MockType';
import { User } from './user.entity';
import { UserFactory } from './user.factory';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let databaseService: DatabaseService;
  let userRepository: Repository<User>;
  let authRolesService: AuthRolesService;
  let authPermissionsService: AuthPermissionsService;

  /**
   * Tests targeting test DB
   */
  describe.only('without mocks', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      const module: TestingModule = await Test.createTestingModule({
        providers: [UsersService, AuthPermissionsService, AuthRolesService],
        imports: [DatabaseModule],
      }).compile();

      usersService = module.get<UsersService>(UsersService);
      databaseService = module.get<DatabaseService>(DatabaseService);
      authPermissionsService = module.get<AuthPermissionsService>(AuthPermissionsService);
      authRolesService = module.get<AuthRolesService>(AuthRolesService);
      userRepository = (await databaseService.getRepository(User)) as Repository<User>;
      await authPermissionsService.loadPermissions();
      await authRolesService.loadRoles();
    });

    afterEach(async () => {
      await getConnection().synchronize(true);
      await getConnection().close();
    });

    /**
     * Create users
     */
    describe('create users', () => {
      it('should create a user', async () => {
        const spy = jest.spyOn(userRepository, 'save');
        const user = new User();
        user.username = 'test';
        user.password = 'test';
        user.email = 'test@test.com';
        user.name = 'test';
        const createdUser = await usersService.create(user);
        expect(createdUser).toHaveProperty('username', user.username);
        expect(spy).toHaveBeenCalled();
      });
    });

    /**
     * Read users
     */
    describe('read users', () => {
      let USER: User = null;
      const USER_DATA = {
        username: 'test',
        password: 'test',
        email: 'test@test.com',
        name: 'test',
      };

      beforeEach(async () => {
        USER = await usersService.create(UserFactory.create(USER_DATA));
        await authRolesService.addRole(USER, AuthRoles.NORMAL);
        await authPermissionsService.addPermission(USER, AuthPermissions.SIGN_IN);
      });

      it('should read basic properties a user', async () => {
        USER = await usersService.findOne({
          where: {
            username: USER.username,
          },
        });
        expect(USER).toHaveProperty('username', USER_DATA.username);
        expect(USER).toHaveProperty('password');
        expect(USER.password).not.toEqual(USER_DATA.password);
        expect(USER).toHaveProperty('email', USER_DATA.email);
        expect(USER).toHaveProperty('name', USER_DATA.name);
      });

      it('should read auth_permissions of a user', async () => {
        USER = await usersService.findOne({
          where: {
            username: USER.username,
          },
        });
        // Reading permissions created on beforeEach()
        const PERMISSIONS = {
          SIGN_IN: await authPermissionsService.readPermissionByDefinition(AuthPermissions.SIGN_IN),
        };
        expect(USER).toHaveProperty('auth_permissions', [PERMISSIONS.SIGN_IN]);
      });

      it('should read auth_roles of a user', async () => {
        USER = await usersService.findOne({
          where: {
            username: USER.username,
          },
        });
        // Reading roles created on beforeEach()
        const ROLES = {
          NORMAL: await authRolesService.readRoleByDefinition(AuthRoles.NORMAL),
        };
        expect(USER).toHaveProperty('auth_roles', [ROLES.NORMAL]);
      });
    });

    /**
     * List users
     */
    describe('list users', () => {
      const TEST_USERS = [];
      const TEST_USERS_DATA = [
        {
          username: 'test1',
          password: 'test1',
          email: 'test1@test.com',
          name: 'test1',
          auth_permissions: [],
          auth_roles: [],
        },
        {
          username: 'test2',
          password: 'test2',
          email: 'test2@test.com',
          name: 'test2',
          auth_permissions: [],
          auth_roles: [],
        },
        {
          username: 'test3',
          password: 'test3',
          email: 'test3@test.com',
          name: 'test3',
          auth_permissions: [],
          auth_roles: [],
        },
        {
          username: 'test4',
          password: 'test4',
          email: 'test4@test.com',
          name: 'test4',
          auth_permissions: [],
          auth_roles: [],
        },
        {
          username: 'test5',
          password: 'test5',
          email: 'test5@test.com',
          name: 'test5',
          auth_permissions: [],
          auth_roles: [],
        },
      ];
      beforeEach(async () => {
        for (const tu of TEST_USERS_DATA) {
          const u = await usersService.create(UserFactory.create(tu));
          TEST_USERS.push(
            await usersService.findOne({
              where: {
                username: u.username,
              },
            }),
          );
        }
      });

      it('should return all users', async () => {
        const spy = jest.spyOn(userRepository, 'find');
        const result = await usersService.findAll();
        expect(result).toHaveLength(TEST_USERS.length);
        expect(result).toEqual(TEST_USERS);
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('mock DB', () => {
    let service: UsersService;
    let userRepositoryMock: MockType<Repository<User>>;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersService,
          {
            provide: DatabaseService,
            useClass: DatabaseServiceMock,
          },
        ],
      }).compile();

      service = module.get<UsersService>(UsersService);
      userRepositoryMock = module.get<DatabaseService>(DatabaseService).getRepository(User) as MockType<
        Repository<User>
      >;
    });

    it('should find a user', async () => {
      const user = { name: 'Alni', id: '123' };
      const query = {
        where: {
          id: user.id,
        },
      };
      userRepositoryMock.findOne.mockReturnValue(user);
      expect(await service.findOne(query)).toEqual(user);
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith(query);
    });

    it('should return null if user does not exist', async () => {
      const id = '100000';
      userRepositoryMock.findOne.mockReturnValue(null);
      const query = {
        where: {
          id,
        },
      };
      expect(await service.findOne(query)).toEqual(null);
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith(query);
    });

    it('should return all users', async () => {
      const users = [
        { name: 'Alni', id: '123' },
        { name: 'Balni', id: '1234' },
        { name: 'Calni', id: '12345' },
      ];
      when(userRepositoryMock.find)
        .calledWith(undefined)
        .mockReturnValue(users);
      expect(await service.findAll()).toEqual(users);
      expect(userRepositoryMock.find).toHaveBeenCalledWith();
    });

    it('should return certain users', async () => {
      const users = [
        { name: 'Alni', id: '123' },
        { name: 'Balni', id: '1234' },
        { name: 'Calni', id: '12345' },
      ];
      const filter = {
        id: '123',
      };
      const query = {
        where: {
          filter,
        },
      };
      when(userRepositoryMock.find)
        .calledWith(query)
        .mockReturnValue([{ name: 'Alni', id: '123' }]);
      expect(await service.find(query)).toEqual([{ name: 'Alni', id: '123' }]);
      expect(userRepositoryMock.find).toHaveBeenCalledWith(query);
    });
  });
});
