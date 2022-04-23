import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import debug from 'debug';
import { Arg, Mutation, Query, Resolver } from 'type-graphql';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AUTH_SIGNUP_SUCCESS_MESSAGE, AUTH_VERIFY_SUCCESS_MESSAGE } from './auth.constants';
import { SignupInput } from './inputs/SignupInput';
import { SigninOutput } from './outputs/SigninOutput';
import { SignupOutput } from './outputs/SignupOutput';
import { VerifyOutput } from './outputs/VerifyOutput';
import { AuthService } from './services/auth.service';

export class SignInResult {
  user: User;
  access_token: string;
}

const log = debug('app:AuthResolver');

@Injectable()
@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  /**
   * It seems that it always require at least 1 query.
   * TODO: Edit with an actual query, maybe isAuthententicated
   */
  @Query(() => [User], {
    description: 'Returns the list of users.',
  })
  async recipes(@Arg('title', { nullable: true }) title?: string): Promise<User[] | null> {
    // ...
    return Promise.resolve([new User()]);
  }

  /**
   * Register a new user
   */
  @Mutation((): typeof SignupOutput => SignupOutput, {
    description: 'Register a new user and send a verification e-mail',
  })
  public async signUp(
    @Arg('data')
    { email, name, username, password }: SignupInput,
  ): Promise<SignupOutput> {
    await this.authService.register({ email, name, username, password });
    return new SignupOutput(AUTH_SIGNUP_SUCCESS_MESSAGE);
  }

  @Mutation(returns => SigninOutput, {
    nullable: true,
    description: 'Sign in a user',
  })
  public async signIn(@Arg('username') username: string, @Arg('password') password: string): Promise<SigninOutput> {
    const user = await this.authService.authenticate(username, password);

    //if (!user) {
    //  throw new HttpException('Invalid credentials.', HttpStatus.FORBIDDEN);
    //}

    delete user.password;

    return {
      user,
      // eslint-disable-next-line @typescript-eslint/camelcase
      access_token: 'xxx',
    };
  }

  @Mutation(returns => VerifyOutput, {
    nullable: false,
    description: 'Verify a user',
  })
  public async verifyEmail(@Arg('token') token: string): Promise<VerifyOutput> {
    log('verifyEmail', { token });
    await this.authService.verify(token);
    return new VerifyOutput(AUTH_VERIFY_SUCCESS_MESSAGE, true);
  }
}
