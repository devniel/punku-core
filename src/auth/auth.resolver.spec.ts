import { TypeOrmTestModule } from '@devniel/nestjs-typeorm-testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/typeorm';
import { GraphQLExtension } from 'apollo-server-core';
import debug from 'debug';
import { graphql, GraphQLError } from 'graphql';
import { RedisService } from 'nestjs-redis';
import prettier from 'prettier';
import request from 'supertest';
import { TypeGraphQLModule } from 'typegraphql-nestjs';
import { Connection, getConnection, useContainer } from 'typeorm';

import { jwtServiceMock } from '../common/mocks/jwt.service.mock';
import { redisServiceMock } from '../common/mocks/redis.service.mock';
import { DatabaseModule } from '../database';
import { DatabaseService } from '../database/database.service';
import { DatabaseServiceMock } from '../database/database.service.mock';
import { EmailAlreadyExistsUsersError, UsernameAlreadyExistsUsersError } from '../users/errors/UserError';
import { User } from '../users/user.entity';
import { UserFactory } from '../users/user.factory';
import { UsersService } from '../users/users.service';
import { usersServiceMock } from '../users/users.service.mock';
import formatError from '../utils/formatError';
import { Logging } from '../utils/Logging';
import { AUTH_SIGNUP_SUCCESS_MESSAGE } from './auth.constants';
import { AuthModule } from './auth.module';
import { AuthModuleMock } from './auth.module.mock';
import { AuthResolver } from './auth.resolver';
import { AuthPermission } from './entities/AuthPermission.entity';
import { AuthRole } from './entities/AuthRole.entity';
import {
  EmailAlreadyExistsAuthError,
  InvalidEmailAuthError,
  InvalidPasswordLengthAuthError,
  UsernameAlreadyExistsAuthError,
} from './errors/AuthError';
import { SignupInput } from './inputs/SignupInput';
import { AuthPermissionsService } from './services/auth_permissions.service';
import { authPermissionsServiceMock } from './services/auth_permissions.service.mock';
import { AuthRolesService } from './services/auth_roles.service';
import { authRolesServiceMock } from './services/auth_roles.service.mock';
import { AuthService } from './services/auth.service';
import { authServiceMock } from './services/auth.service.mock';

const log = debug('test:AuthResolver');

describe('AuthResolver() - controller/service layer', () => {
  let authResolver: AuthResolver;
  let connection: Connection;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [AuthResolver],
      imports: [TypeOrmTestModule.forTest([User, AuthRole, AuthPermission])],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
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
      ],
    }).compile();
    authResolver = module.get<AuthResolver>(AuthResolver);
    connection = module.get(getConnectionToken());
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(authResolver).toBeDefined();
  });

  it('should save the user and return a success message', async () => {
    const user = UserFactory.createFakeUser();
    const result = await authResolver.signUp(user as SignupInput);
    expect(result).toHaveProperty('message');
  });
});

describe('AuthResolver() - graphql/validation layer', () => {
  let app: INestApplication;
  let module: TestingModule;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmTestModule.forTest([User, AuthRole, AuthPermission]),
        TypeGraphQLModule.forRoot({
          emitSchemaFile: true,
          validate: true,
          dateScalarMode: 'timestamp',
          context: ({ req }) => ({ currentUser: req.user }),
          extensions: [(): any => new Logging() as GraphQLExtension<any>],
          formatError,
        }),
        AuthModuleMock,
      ],
    })
      .overrideProvider(AuthService)
      .useClass(AuthService)
      .compile();
    app = module.createNestApplication();
    authService = module.get<AuthService>(AuthService) as jest.Mocked<AuthService>;
    usersService = module.get<UsersService>(UsersService) as jest.Mocked<UsersService>;
    useContainer(app, { fallbackOnErrors: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    (usersService.create as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(module).toBeDefined();
  });

  describe('signUp()', () => {
    it('should return error if user data is requested as output', async () => {
      const mutation = `
          mutation {
            signUp(data: {
                email: "test@gmail.com",
                name: "test",
                username: "test"
                password: "12345678"
            }) {
              user
            }
          }
        `;
      const { schema } = app.get(GraphQLSchemaHost);
      const response = await graphql(schema, mutation);
      log('response', response);
      expect(response.errors).toBeTruthy();
      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].message).toEqual('Cannot query field "user" on type "SignupOutput".');
    });

    it('should return error if not all the user properties are provided', async () => {
      const mutation = `
          mutation {
            signUp(data: {
                email: "test@gmail.com",
                name: "test",
                username: "test"
            }) {
              message
            }
          }
        `;
      const { schema } = app.get(GraphQLSchemaHost);
      const response = await graphql(schema, mutation);
      log('response', response);
      expect(response.errors).toBeTruthy();
      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].message).toEqual(
        'Field SignupInput.password of required type String! was not provided.',
      );
    });

    it(`should return 'InvalidEmailAuthError' error if the email is not valid`, async () => {
      const mutation = `
          mutation {
            signUp(data: {
                email: "test.com",
                name: "test",
                username: "test",
                password: "test"
            }) {
              message
            }
          }
        `;
      const { schema } = app.get(GraphQLSchemaHost);
      const response = await graphql(schema, mutation);
      log('response', response);
      expect(response.errors).toBeTruthy();
      expect(response.errors).toHaveLength(1);
      const error: GraphQLError = response.errors[0];
      expect(error.originalError).toBeInstanceOf(InvalidEmailAuthError);
    });

    it(`should return 'InvalidPasswordLengthAuthError' error if the password is not valid`, async () => {
      const mutation = `
          mutation {
            signUp(data: {
                email: "test@test.com",
                name: "test",
                username: "test",
                password: "1234"
            }) {
             message
            }
          }
        `;
      const { schema } = app.get(GraphQLSchemaHost);
      const response = await graphql(schema, mutation);
      log('response:', response);
      expect(response.errors).toBeTruthy();
      expect(response.errors).toHaveLength(1);
      const error: GraphQLError = response.errors[0];
      expect(error.originalError).toBeInstanceOf(InvalidPasswordLengthAuthError);
    });

    it('should not return error if the password is valid', async () => {
      const data = {
        username: 'test',
        password: '12345678',
        email: 'test@email.com',
        name: 'test',
      };
      const user = UserFactory.create(data);
      (usersService.create as jest.Mock).mockReturnValue(user);
      const mutation = `
          mutation signUp($data: SignupInput!) {
            signUp(data: $data) {
              message
            }
          }
        `;
      const { schema } = app.get(GraphQLSchemaHost);
      const response = await graphql(schema, mutation, null, null, {
        data,
      });
      log(
        'response:',
        `${prettier.format(JSON.stringify(response), {
          parser: 'json',
        })}`,
      );
      expect(response.errors).toBeFalsy();
    });
  });
});

describe('AuthResolver() - e2e (mock database)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let usersService: jest.Mocked<UsersService>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmTestModule.forTest([User, AuthRole, AuthPermission]),
        TypeGraphQLModule.forRoot({
          emitSchemaFile: true,
          validate: true,
          dateScalarMode: 'timestamp',
          context: ({ req }) => ({ currentUser: req.user }),
        }),
        AuthModuleMock,
      ],
    }).compile();
    app = module.createNestApplication();
    usersService = module.get<UsersService>(UsersService) as jest.Mocked<UsersService>;
    useContainer(app, { fallbackOnErrors: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    (usersService.create as jest.Mock).mockReset();
  });

  describe('signUp()', () => {
    it('(400)(errors) should return error if not all the user properties are provided', async () => {
      const data = {
        email: 'test@gmail.com',
        name: 'test',
        username: 'test',
      };
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      // For bad input data based based on its type, the status code is 400.
      expect(r.status).toEqual(400);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.data).toBeFalsy();
    });
    it('(200)(errors) should return error if the email is not valid', async () => {
      const data = {
        email: 'test.com',
        name: 'test',
        username: 'test',
        password: '12345678',
      };
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(errors) should return error if the password is not valid', async () => {
      const data = {
        email: 'test@test.com',
        name: 'test',
        username: 'test',
        password: '1234',
      };
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(errors) should return errors if the email and password are not valid', async () => {
      const data = {
        email: 'test.com',
        name: 'test',
        username: 'test',
        password: '1234',
      };
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(errors) should return error if the email is already registered', async () => {
      // Put data to pass validations layer
      const data = {
        email: 'test@test.com',
        username: 'test',
        password: '12345678',
        name: 'test',
      };
      const user = UserFactory.create(data);
      // throw UsersError(), it will be capture by the service.
      (usersService.create as jest.Mock).mockRejectedValue(new EmailAlreadyExistsUsersError());
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.errors[0].extensions.code).toEqual(new EmailAlreadyExistsAuthError().extensions.code);
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(errors) should return error if the user is already registered', async () => {
      // Put data to pass validations layer
      const data = {
        email: 'test@test.com',
        username: 'test',
        password: '12345678',
        name: 'test',
      };
      const user = UserFactory.create(data);
      // throw UsersError(), it will be capture by the service.
      (usersService.create as jest.Mock).mockRejectedValue(new UsernameAlreadyExistsUsersError());
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.errors[0].extensions.code).toEqual(new UsernameAlreadyExistsAuthError().extensions.code);
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(data) should return a success message', async () => {
      const data = {
        email: 'test@test.com',
        username: 'test',
        password: '12345678',
        name: 'test',
      };
      const user = UserFactory.create(data);
      (usersService.create as jest.Mock).mockReturnValue(user);
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.data.signUp).toEqual({
        message: AUTH_SIGNUP_SUCCESS_MESSAGE,
      });
    });
  });
});

describe('AuthResolver() - e2e (real database)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        AuthModule,
        DatabaseModule,
        TypeGraphQLModule.forRoot({
          emitSchemaFile: true,
          validate: true,
          dateScalarMode: 'timestamp',
          context: ({ req }) => ({ currentUser: req.user }),
        }),
      ],
    }).compile();
    app = module.createNestApplication();
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService) as jest.Mocked<UsersService>;

    useContainer(app, { fallbackOnErrors: true });
    await app.init();
  });

  afterAll(async () => {
    log('afterAll()');
    //await getConnection().synchronize(true);
    await getConnection().close();
    await app.close();
  });

  beforeEach(async () => {
    log('beforeEach()');
    try {
      await getConnection().synchronize(true);
    } catch (e) {
      log(e);
    }
    log('beforeEach() - isTransaction', getConnection().createQueryRunner().isTransactionActive);
  });

  describe('signUp()', () => {
    it('(400)(errors) should return error if not all the user properties are provided', async () => {
      const data = {
        email: 'test@gmail.com',
        name: 'test',
        username: 'test',
      };
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      // For bad input data based based on its type, the status code is 400.
      expect(r.status).toEqual(400);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.data).toBeFalsy();
    });
    it('(200)(errors) should return error if the email is not valid', async () => {
      const data = {
        email: 'test.com',
        name: 'test',
        username: 'test',
        password: '12345678',
      };
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(errors) should return error if the password is not valid', async () => {
      const data = {
        email: 'test@test.com',
        name: 'test',
        username: 'test',
        password: '1234',
      };
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(errors) should return errors if the email and password are not valid', async () => {
      const data = {
        email: 'test.com',
        name: 'test',
        username: 'test',
        password: '1234',
      };
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(errors) should return error if the email is already registered', async () => {
      log('starting test');
      // Register user
      const data = {
        email: 'test@test.com',
        username: 'test',
        password: '12345678',
        name: 'test',
      };
      await authService.register(data);
      const user = UserFactory.create(data);
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data: {
              email: 'test@test.com',
              username: 'test2',
              password: '12345678',
              name: 'test',
            },
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.errors[0].extensions.code).toEqual(new EmailAlreadyExistsAuthError().extensions.code);
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(errors) should return error if the user is already registered', async () => {
      // Put data to pass validations layer
      const data = {
        email: 'test@test.com',
        username: 'test',
        password: '12345678',
        name: 'test',
      };
      await authService.register(data);
      const user = UserFactory.create(data);
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data: {
              email: 'test@test2.com',
              username: 'test',
              password: '12345678',
              name: 'test',
            },
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.errors).toBeTruthy();
      expect(r.body.errors[0].extensions.code).toEqual(new UsernameAlreadyExistsAuthError().extensions.code);
      expect(r.body.signUp).toBeFalsy();
    });
    it('(200)(data) should return a success message', async () => {
      const data = {
        email: 'test@test.com',
        username: 'test',
        password: '12345678',
        name: 'test',
      };
      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            data,
          },
          query: `
              mutation signUp($data: SignupInput!) {
                signUp(data: $data){
                  message
                }
              }
          `,
        });
      log(
        `${prettier.format(r.text, {
          parser: 'json',
        })}`,
      );
      expect(r.status).toEqual(200);
      expect(r.body.data.signUp).toEqual({
        message: AUTH_SIGNUP_SUCCESS_MESSAGE,
      });
    });
  });
});
