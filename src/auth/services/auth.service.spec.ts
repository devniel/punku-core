import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { RedisService } from 'nestjs-redis';
import { mocked } from 'ts-jest/utils';

import { configServiceMock } from '../../common/mocks/config.service.mock';
import { jwtServiceMock } from '../../common/mocks/jwt.service.mock';
import { redisServiceMock } from '../../common/mocks/redis.service.mock';
import { DatabaseService } from '../../database/database.service';
import { DatabaseServiceMock } from '../../database/database.service.mock';
import { EmailAlreadyExistsUsersError, UsernameAlreadyExistsUsersError } from '../../users/errors/UserError';
import { User } from '../../users/user.entity';
import { UserFactory } from '../../users/user.factory';
import { UsersService } from '../../users/users.service';
import { usersServiceMock } from '../../users/users.service.mock';
import { AuthPermissions } from '../entities/permissions';
import { AuthRoles } from '../entities/roles';
import {
  EmailAlreadyExistsAuthError,
  InvalidCredentialsAuthError,
  InvalidEmailAuthError,
  InvalidNameEmptyAuthError,
  InvalidNumericUsernameCharactersAuthError,
  InvalidPasswordEmptyAuthError,
  InvalidPasswordLengthAuthError,
  InvalidRegistrationTokenAuthError,
  InvalidUsernameCharactersAuthError,
  InvalidUsernameEmptyAuthError,
  InvalidUsernameLengthAuthError,
  InvalidVerificationTokenAuthError,
  UserAlreadyVerifiedAuthError,
  UserIsBannedAuthError,
  UsernameAlreadyExistsAuthError,
  UserNotFoundAuthError,
  UserWasNotCreatedAuthError,
} from '../errors/AuthError';
import { AuthEmailService } from './auth_email.service';
import { authEmailServiceMock } from './auth_email.service.mock';
import { AuthPermissionsService } from './auth_permissions.service';
import { authPermissionsServiceMock } from './auth_permissions.service.mock';
import { AuthRolesService } from './auth_roles.service';
import { authRolesServiceMock } from './auth_roles.service.mock';
import { AuthService } from './auth.service';

/**
 * This mock should be done before creating the testing module
 */
jest.mock('bcrypt');
const bcryptMock = mocked(bcrypt, true);

describe('AuthService', () => {
  let authService: AuthService;
  let authPermissionsService: jest.Mocked<AuthPermissionsService>;
  let authRolesService: jest.Mocked<AuthRolesService>;
  let authEmailService: jest.Mocked<AuthEmailService>;
  let usersService: jest.Mocked<UsersService>;
  let databaseService: jest.Mocked<DatabaseService>;
  let configService: jest.Mocked<ConfigService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: AuthRolesService,
          useValue: authRolesServiceMock,
        },
        {
          provide: AuthPermissionsService,
          useValue: authPermissionsServiceMock,
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
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: AuthEmailService,
          useValue: authEmailServiceMock,
        },
      ],
      imports: [],
    }).compile();
    usersService = module.get<UsersService>(UsersService) as jest.Mocked<UsersService>;
    databaseService = module.get<DatabaseService>(DatabaseService) as jest.Mocked<DatabaseService>;
    authService = module.get<AuthService>(AuthService);
    authPermissionsService = module.get<AuthPermissionsService>(AuthPermissionsService) as jest.Mocked<
      AuthPermissionsService
    >;
    authRolesService = module.get<AuthRolesService>(AuthRolesService) as jest.Mocked<AuthRolesService>;
    configService = module.get<ConfigService>(ConfigService) as jest.Mocked<ConfigService>;
    authEmailService = module.get<AuthEmailService>(AuthEmailService) as jest.Mocked<AuthEmailService>;
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
  });

  afterEach(() => {
    usersService.findAll.mockReset();
    usersService.find.mockReset();
    usersService.findOne.mockReset();
    usersService.create.mockReset();
    usersService.update.mockReset();
    usersService.isAuthorized.mockReset();
    jwtService.verify.mockReset();
    jwtService.sign.mockReset();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(authPermissionsService).toBeDefined();
    expect(authRolesService).toBeDefined();
  });

  describe('register()', () => {
    it('should register a new user', async () => {
      // User data
      const userWithoutId = UserFactory.create({
        username: 'test',
        password: '12345678',
        email: 'test@email.com',
        name: 'test',
      });
      const user = UserFactory.create({
        ...userWithoutId,
        id: 12345,
      });
      // Expected result
      const expected = {
        id: expect.any(Number),
        username: user.username,
      };
      // Mock config
      (usersService.create as jest.Mock).mockReturnValue(user);
      // Execute auth registration and expectations
      expect(await authService.register(userWithoutId)).toEqual(expected);
      expect(databaseService.makeUnitOfWork).toHaveBeenCalled();
      const uow = databaseService.makeUnitOfWork();
      expect(usersService.create).toHaveBeenCalledWith(userWithoutId, uow);
      expect(usersService.findOne).not.toHaveBeenCalled();
      // Next calls should have user object with id
      expect(authRolesService.addRole).toHaveBeenCalledWith(user, AuthRoles.NORMAL, uow);
      expect(authPermissionsService.addPermission).toHaveBeenCalledWith(user, AuthPermissions.SIGN_IN, uow);
      expect(authPermissionsService.addPermission).toHaveBeenCalledWith(user, AuthPermissions.SIGN_UP, uow);
    });
    it('should throw `UserWasNotCreatedAuthError` when there are problems while creating the user', async () => {
      const user = UserFactory.createFakeUserBeforeRegistering();
      usersService.create.mockImplementation(() => Promise.reject(new Error()));
      await expect(authService.register(user)).rejects.toThrow(UserWasNotCreatedAuthError);
      expect(usersService.create).toHaveBeenCalledWith(user, databaseService.makeUnitOfWork());
    });
    it('should throw `UsernameAlreadyExistsAuthError` when the username already exists while registering', async () => {
      const user = UserFactory.createFakeUserBeforeRegistering();
      usersService.create.mockImplementation(() => Promise.reject(new UsernameAlreadyExistsUsersError()));
      await expect(authService.register(user)).rejects.toThrow(UsernameAlreadyExistsAuthError);
      expect(usersService.create).toHaveBeenCalledWith(user, databaseService.makeUnitOfWork());
    });
    it('should throw `EmailAlreadyExistsAuthError` when the email already exists while registering', async () => {
      const user = UserFactory.createFakeUserBeforeRegistering();
      usersService.create.mockImplementation(() => Promise.reject(new EmailAlreadyExistsUsersError()));
      await expect(authService.register(user)).rejects.toThrow(EmailAlreadyExistsAuthError);
      expect(usersService.create).toHaveBeenCalledWith(user, databaseService.makeUnitOfWork());
    });
    it('should throw `InvalidEmailAuthError` when there is an invalid email being used while registering a new user', async () => {
      const user = {
        username: 'test',
        password: 'test',
        email: 'notanemail',
        name: 'test',
      };
      await expect(authService.register(user)).rejects.toThrow(InvalidEmailAuthError);
      expect(usersService.create).not.toBeCalled();
    });
    it('should throw `InvalidUsernameEmptyAuthError` when there is an invalid empty username being used while registering a new user', async () => {
      const user = {
        username: '',
        password: 'test',
        email: 'test@email.com',
        name: 'test',
      };
      await expect(authService.register(user)).rejects.toThrow(InvalidUsernameEmptyAuthError);
      expect(usersService.create).not.toBeCalled();
    });
    it('should throw `InvalidNumericUsernameCharactersAuthError` when there is an username with only numbers being used while registering a new user', async () => {
      await expect(
        authService.register({
          username: '12345678',
          password: '12345678',
          email: 'test@email.com',
          name: 'test',
        }),
      ).rejects.toThrow(InvalidNumericUsernameCharactersAuthError);
      expect(usersService.create).not.toBeCalled();
    });
    it('should throw `InvalidUsernameCharactersAuthError` when there is an invalid character in the username being used while registering a new user', async () => {
      (usersService.create as jest.Mock).mockReturnValue(UserFactory.createFakeUser());
      const usernames = ['test@', '~test', '//test', '#test', '[test]'];
      for (const username of usernames) {
        const user = {
          username,
          password: '12345678',
          email: 'test@email.com',
          name: 'test',
        };
        await expect(authService.register(user)).rejects.toThrow(InvalidUsernameCharactersAuthError);
        expect(usersService.create).not.toBeCalled();
      }
      const good_usernames = ['test', 'test_', 'test_test', 'test2', '_test', '__test', 'test1234'];
      for (const username of good_usernames) {
        const user = {
          username,
          password: '12345678',
          email: 'test@email.com',
          name: 'test',
        };
        await expect(authService.register(user)).resolves.toBeTruthy();
        expect(usersService.create).toBeCalled();
      }
    });
    it('should throw `InvalidUsernameLengthAuthError` when there is an invalid length of username being used while registering a new user', async () => {
      const usernames = ['t', 'te', 'tes', 'z', 'zu', 'zuk', 'danielmauri'];
      for (const username of usernames) {
        const user = {
          username,
          password: 'test',
          email: 'test@email.com',
          name: 'test',
        };
        await expect(authService.register(user)).rejects.toThrow(InvalidUsernameLengthAuthError);
        expect(usersService.findOne).not.toBeCalled();
      }
    });
    it('should throw `InvalidPasswordLengthAuthError` when there is an invalid length of password being used while registering a new user', async () => {
      const passwords = ['1', '12', '123', '1234', '12345', '123456', '1234567'];
      for (const password of passwords) {
        const user = {
          username: 'test',
          password,
          email: 'test@email.com',
          name: 'test',
        };
        await expect(authService.register(user)).rejects.toThrow(InvalidPasswordLengthAuthError);
        expect(usersService.findOne).not.toBeCalled();
      }
    });
    it('should throw `InvalidPasswordEmptyAuthError` when there is an invalid empty password being used while registering a new user', async () => {
      const passwords = ['', null];
      for (const password of passwords) {
        const user = {
          username: 'test',
          password,
          email: 'test@email.com',
          name: 'test',
        };
        await expect(authService.register(user)).rejects.toThrow(InvalidPasswordEmptyAuthError);
        expect(usersService.findOne).not.toBeCalled();
      }
    });
    it('should throw `InvalidNameEmptyAuthError` when there is an invalid empty name being used while registering a new user', async () => {
      const names = ['', ' ', '   ', '           '];
      for (const name of names) {
        const user = {
          username: 'test',
          password: '12345678',
          email: 'test@email.com',
          name,
        };
        await expect(authService.register(user)).rejects.toThrow(InvalidNameEmptyAuthError);
        expect(usersService.findOne).not.toBeCalled();
      }
    });
    it('should throw `InvalidRegistrationTokenAuthError` when there is an invalid registration token being used', async () => {
      const user = UserFactory.createFakeUser();
      jwtService.verify.mockImplementation(() => {
        throw new InvalidRegistrationTokenAuthError();
      });
      await expect(authService.register(user, 'a token')).rejects.toThrow(InvalidRegistrationTokenAuthError);
      expect(usersService.create).not.toBeCalled();
    });
    it('should validate a valid registration token (provided via invitation) when registering', async () => {
      configService.get.mockReturnValue('secret');
      const user = UserFactory.createFakeUser({
        username: 'test',
        id: '12345',
      });
      jwtService.verify.mockReturnValue({
        verification: true,
        user: user.username,
      });
      usersService.create.mockReturnValue(Promise.resolve(user));
      await expect(authService.register(user, 'token')).resolves.toBeTruthy();
      expect(usersService.create).toBeCalled();
      configService.get.mockRestore();
    });
    it('should register a user without a registration token', async () => {
      const user = UserFactory.createFakeUser({
        username: 'test',
        id: '12345',
      });
      usersService.create.mockReturnValue(Promise.resolve(user));
      await expect(authService.register(user)).resolves.toBeTruthy();
      expect(usersService.create).toBeCalled();
    });
    it('should generate a verification url when registering a user with success', async () => {
      const spy = jest.spyOn(authService, 'createConfirmationUrl');
      const user = UserFactory.createFakeUser({
        username: 'test',
        id: '12345',
      });
      usersService.create.mockReturnValue(Promise.resolve(user));
      await expect(authService.register(user)).resolves.toBeTruthy();
      expect(usersService.create).toBeCalled();
      expect(spy).toBeCalled();
    });
    it('an email should be sent when user was registered with success', async () => {
      const spy = jest.spyOn(authService, 'createConfirmationUrl');
      const user = UserFactory.createFakeUser({
        username: 'test',
        id: '12345',
      });
      usersService.create.mockReturnValue(Promise.resolve(user));
      await expect(authService.register(user)).resolves.toBeTruthy();
      expect(usersService.create).toBeCalled();
      expect(spy).toBeCalled();
      expect(authEmailService.sendVerificationEmail).toBeCalled();
    });
  });

  describe('authenticate()', () => {
    it('should authenticate a user and call bcrypt', async () => {
      bcryptMock.hash.mockReturnValue(Promise.resolve('password'));
      bcryptMock.compare.mockReturnValue(Promise.resolve(true));

      // User data
      const user = {
        username: 'test',
        password: '12345678',
      };
      // Query
      const query = {
        where: {
          username: user.username,
        },
      };
      const expected = UserFactory.create({
        username: 'test',
        name: 'test',
        email: 'test@test.com',
        password: await bcrypt.hash(user.password, 10),
        verified_email: true,
        active: true,
      });
      (usersService.findOne as any).mockReturnValue(Promise.resolve(expected));
      expect(await authService.authenticate(user.username, user.password)).toEqual(expected);
      expect(usersService.findOne).toHaveBeenCalledWith(query);
      expect(bcryptMock.compare).toHaveBeenCalled();
      bcryptMock.hash.mockRestore();
      bcryptMock.compare.mockRestore();
    });
    it('should throw `UserNotFoundAuthError` when authenticating an unexistent user', async () => {
      const user = UserFactory.createFakeUser();
      const query = {
        where: {
          username: user.username,
        },
      };
      usersService.findOne.mockReturnValue(null);
      await expect(authService.authenticate(user.username, user.password)).rejects.toThrow(UserNotFoundAuthError);
      expect(usersService.findOne).toHaveBeenCalledWith(query);
    });
    it('should throw `InvalidCredentialsAuthError` when there are invalid credentials while authenticating', async () => {
      const user = UserFactory.createFakeUser({
        verified_email: true,
        active: true,
      });
      const query = {
        where: {
          username: user.username,
        },
      };
      usersService.findOne.mockReturnValue(Promise.resolve(user));
      await expect(authService.authenticate(user.username, 'badpassword')).rejects.toThrow(InvalidCredentialsAuthError);
      expect(usersService.findOne).toHaveBeenCalledWith(query);
    });
    it('should throw `UserNotVerifiedAuthError` when user is not verified while authenticating', async () => {
      const user = UserFactory.createFakeUser();
      const query = {
        where: {
          username: user.username,
        },
      };
      usersService.findOne.mockReturnValue(Promise.resolve(user));
      await expect(authService.authenticate(user.username, 'badpassword')).rejects.toThrow(InvalidCredentialsAuthError);
      expect(usersService.findOne).toHaveBeenCalledWith(query);
    });
    it('should throw `UserIsBannedAuthError` when user is banned while authenticatend', async () => {
      bcryptMock.compare.mockReturnValue(Promise.resolve(true));
      const user = UserFactory.createFakeUser({
        verified_email: true,
        active: false,
      });
      const query = {
        where: {
          username: user.username,
        },
      };
      usersService.findOne.mockReturnValue(Promise.resolve(user));
      await expect(authService.authenticate(user.username, user.password)).rejects.toThrow(UserIsBannedAuthError);
      expect(usersService.findOne).toHaveBeenCalledWith(query);
      bcryptMock.compare.mockRestore();
    });
  });

  describe('isAuthorized()', () => {
    it('should authorize a user', async () => {
      (usersService.isAuthorized as any).mockReturnValue(true);
      const userObject = new User();
      userObject.id = 123456789;
      userObject.username = 'sdsdsdsds';
      const permission = await authPermissionsService.readPermissionByDefinition(AuthPermissions.SIGN_IN);
      expect(await authService.isAuthorized(userObject, permission)).toEqual(true);
      expect(usersService.isAuthorized).toHaveBeenCalled();
    });
  });

  describe('verify()', () => {
    it('should verify a user by checking a token', async () => {
      configService.get.mockReturnValue('secret');
      const user = UserFactory.createFakeUser({
        verified_email: false,
        active: true,
      });
      const query = {
        where: {
          username: user.username,
        },
      };
      usersService.findOne.mockReturnValue(Promise.resolve(user));
      usersService.update.mockReturnValue(Promise.resolve(UserFactory.create({ ...user, verified_email: true })));
      jwtService.verify.mockReturnValue({
        verification: true,
        user: user.username,
      });
      await expect(authService.verify('token')).resolves.toHaveProperty('verified_email', true);
      expect(usersService.findOne).toHaveBeenCalledWith(query);
      expect(usersService.update).toHaveBeenCalledWith(user, {
        verified_email: true,
      });
      configService.get.mockRestore();
    });
    it('should throw `InvalidVerificationTokenAuthError` when verifying a user via a token using an invalid token', async () => {
      const token = 'invalid_token';
      jwtService.verify.mockImplementation(() => {
        throw new InvalidVerificationTokenAuthError();
      });
      await expect(authService.verify(token)).rejects.toThrow(InvalidVerificationTokenAuthError);
      expect(usersService.findOne).not.toHaveBeenCalled();
    });
    it('should throw `InvalidVerificationTokenAuthError` when verifying a user via a token with a non-existent user', async () => {
      configService.get.mockReturnValue('secret');
      const query = {
        where: {
          username: 'test',
        },
      };
      usersService.findOne.mockReturnValue(Promise.resolve(null));
      jwtService.verify.mockReturnValue({
        verification: true,
        user: 'test',
      });
      await expect(authService.verify('token')).rejects.toThrow(InvalidVerificationTokenAuthError);
      expect(usersService.findOne).toHaveBeenCalledWith(query);
      configService.get.mockRestore();
    });
    it('should throw `UserAlreadyVerifiedAuthError` when user is already verified while verifying', async () => {
      configService.get.mockReturnValue('secret');
      const user = UserFactory.createFakeUser({
        verified_email: true,
        active: true,
      });
      const query = {
        where: {
          username: user.username,
        },
      };
      usersService.findOne.mockReturnValue(Promise.resolve(user));
      jwtService.verify.mockReturnValue({
        verification: true,
        user: user.username,
      });
      await expect(authService.verify('token')).rejects.toThrow(UserAlreadyVerifiedAuthError);
      expect(usersService.findOne).toHaveBeenCalledWith(query);
      expect(usersService.update).not.toHaveBeenCalled();
      configService.get.mockRestore();
    });
    it.todo('should throw `InvalidIDAuthError` when there is an invalid ID being used');
  });

  describe('resendVerificationEmail()', () => {});
});
