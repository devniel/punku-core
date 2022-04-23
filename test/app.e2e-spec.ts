import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import prettier from 'prettier';
import request from 'supertest';

import { AuthService } from '../src/auth/services/auth.service';
import AppModule from './../src/app.module';
import { DatabaseModule } from './../src/database/database.module';
import { DatabaseService } from './../src/database/database.service';
import { UsersService } from './../src/users/users.service';
import { TestUtils } from './test.utils';

const usersServiceMock = {
  findAll: () => {
    return [];
  },
  find: query => {
    return [];
  },
  findOne: query => {
    return [];
  },
  create: user => {
    return [];
  },
};

const authServiceMock = {
  validateUser: jest.fn((username, password): any => {
    return true;
  }),
};

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let testUtils: TestUtils;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [DatabaseService, TestUtils],
    })
      .overrideProvider(UsersService)
      .useValue(usersServiceMock)
      .overrideProvider(AuthService)
      .useValue(authServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    testUtils = moduleFixture.get<TestUtils>(TestUtils);

    await testUtils.resetDb();
    await app.init();
  });

  afterEach(async done => {
    await testUtils.resetDb();
    await testUtils.closeDbConnection();
    done();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('login - should return the access token and the user when a valid user logs in', async () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      username: 'test',
      password: 'test',
      name: 'test',
      verified_email: true,
    };

    try {
      authServiceMock.validateUser.mockReturnValue(user);

      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            username: user.username,
            password: user.password,
          },
          query: `
          mutation signIn($username: String!, $password: String!) {
            signIn(username: $username, password: $password){
              user{
                id
                username
                email
                name
                verified_email
              }
              access_token
            }
          }
        `,
        });

      if (r.error) {
        console.log(
          `${prettier.format(JSON.stringify(r.error), {
            parser: 'json',
          })}`,
        );
        console.log(
          `${prettier.format(r.error.text, {
            parser: 'json',
          })}`,
        );
      }

      expect(authServiceMock.validateUser).toHaveBeenCalledWith(user.username, user.password);
      expect(r.status).toEqual(200);
      expect(r.body.data.signIn).toEqual({
        access_token: 'xxx',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          verified_email: user.verified_email,
        },
      });
    } catch (e) {
      throw e;
    }
  });

  it('login - should return error if the user does not exist', async () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      username: 'test',
      password: 'test',
      name: 'test',
      verified_email: true,
    };

    try {
      authServiceMock.validateUser.mockReturnValue(null);

      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            username: user.username,
            password: user.password,
          },
          query: `
          mutation signIn($username: String!, $password: String!) {
            signIn(username: $username, password: $password){
              user{
                id
                username
                email
                name
                verified_email
              }
              access_token
            }
          }
        `,
        });

      if (r.error) {
        console.log(
          `${prettier.format(JSON.stringify(r.error), {
            parser: 'json',
          })}`,
        );
        console.log(
          `${prettier.format(r.error.text, {
            parser: 'json',
          })}`,
        );
      }

      console.log('body.data.signIn:', r.body.data.signIn);
      console.log('body:', r.body);

      expect(authServiceMock.validateUser).toHaveBeenCalledWith(user.username, user.password);
      expect(r.status).toEqual(200);
      expect(r.body.data.signIn).toEqual(null);
      expect(r.body.errors[0].message).toEqual('Invalid credentials.');
    } catch (e) {
      throw e;
    }
  });

  it('login - should return error if there are invalid credentials', async () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      username: 'test',
      password: 'test',
      name: 'test',
      verified_email: true,
    };

    try {
      authServiceMock.validateUser.mockReturnValue(null);

      const r = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {
            username: user.username,
            password: 'other password',
          },
          query: `
          mutation signIn($username: String!, $password: String!) {
            signIn(username: $username, password: $password){
              user{
                id
                username
                email
                name
                verified_email
              }
              access_token
            }
          }
        `,
        });

      if (r.error) {
        console.log(
          `${prettier.format(JSON.stringify(r.error), {
            parser: 'json',
          })}`,
        );
        console.log(
          `${prettier.format(r.error.text, {
            parser: 'json',
          })}`,
        );
      }

      console.log('body.data.signIn:', r.body.data.signIn);
      console.log('body:', r.body);

      expect(authServiceMock.validateUser).toHaveBeenCalledWith(user.username, user.password);
      expect(r.status).toEqual(200);
      expect(r.body.data.signIn).toEqual(null);
      expect(r.body.errors[0].message).toEqual('Invalid credentials.');
    } catch (e) {
      throw e;
    }
  });
});
