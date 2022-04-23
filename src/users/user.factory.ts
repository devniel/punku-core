import faker from 'faker';

import { User } from './user.entity';

export class UserFactory {
  static create(params: {
    id?: number;
    name: string;
    username: string;
    email: string;
    password: string;
    verified_email?: boolean;
    active?: boolean;
  }): User {
    const user = new User();
    user.id = params.id;
    user.name = params.name;
    user.username = params.username;
    user.email = params.email;
    user.password = params.password;
    // eslint-disable-next-line @typescript-eslint/camelcase
    user.verified_email = params.verified_email;
    user.active = params.active != null ? params.active : true;
    return user;
  }

  /**
   * Creates a fake user
   * @param username
   * @param id
   * @param verified_email
   */
  static createFakeUser(params: { username?; id?; verified_email?; active? } = {}) {
    const p = {
      id: params.id,
      name: faker.name.findName(),
      username: params.username || 'test',
      email: faker.internet.email(),
      password: faker.internet.password(),
      verified_email: params.verified_email,
      active: params.active != null ? params.active : true,
    };
    return this.create(p);
  }

  /**
   * Creates a fake user
   * @param username
   * @param id
   * @param verified_email
   */
  static createFakeUserBeforeRegistering() {
    const p = {
      name: faker.name.findName(),
      username: 'test',
      email: faker.internet.email(),
      password: faker.internet.password(),
    };
    return this.create(p);
  }
}
