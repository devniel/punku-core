import { Injectable, Logger } from '@nestjs/common';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';

import { UserCreateInput } from './inputs/UserCreateInput';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Injectable()
@Resolver()
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns the list of users
   * @param ctx
   */
  @Query(() => [User], {
    description: 'Returns the list of users.',
  })
  async users(@Ctx() ctx): Promise<User[] | null> {
    const users = await this.usersService.findAll();
    return users;
  }

  /**
   * Returns the current logger user
   * @param ctx
   */
  @Query(() => User, {
    nullable: true,
    description: 'Returns the current logged user.',
  })
  async me(@Ctx() ctx): Promise<User | undefined> {
    this.logger.log('WTF');

    if (!ctx.req.session.user) {
      return undefined;
    }

    const user = await this.usersService.findOne(ctx.req.session.user.id);
    return user;
  }

  /**
   * Register a new user
   * @param param0
   */
  @Mutation((): typeof User => User, {
    description: 'Register a new user',
  })
  async create(
    @Arg('data')
    { email, name, username, password }: UserCreateInput,
  ): Promise<User> {
    const user = await User.create({
      name,
      email,
      username,
      password,
    });

    return this.usersService.create(user);
  }
}
