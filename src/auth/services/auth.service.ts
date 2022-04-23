import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import debug from 'debug';
import validator from 'validator';

import { DatabaseService } from '../../database/database.service';
import { EmailAlreadyExistsUsersError, UsernameAlreadyExistsUsersError } from '../../users/errors/UserError';
import { User } from '../../users/user.entity';
import { UserFactory } from '../../users/user.factory';
import { UsersService } from '../../users/users.service';
import { AuthPermission } from '../entities/AuthPermission.entity';
import { AuthPermissionBasicModel, AuthPermissions } from '../entities/permissions';
import { AuthRoles } from '../entities/roles';
import {
  EmailAlreadyExistsAuthError,
  EmailSendingAuthError,
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
  UserNotVerifiedAuthError,
  UserWasNotCreatedAuthError,
} from '../errors/AuthError';
import { AuthEmailService } from './auth_email.service';
import { AuthPermissionsService } from './auth_permissions.service';
import { AuthRolesService } from './auth_roles.service';

interface LoginParams {
  username: string;
  password: string;
}

const log = debug('app:AuthService');

@Injectable()
export class AuthService {
  constructor(
    private readonly authRolesService: AuthRolesService,
    private readonly authPermissionsService: AuthPermissionsService,
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly authEmailService: AuthEmailService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticate the user based on its credentials
   * @param {string} username user's username
   * @param {string} password user's password
   * @throws {UserNotFoundAuthError,UserNotFoundAuthError} authentication error
   * @returns {User} user successfully authenticated
   */
  async authenticate(username: string, password: string): Promise<User> {
    // Get user
    const user = await this.usersService.findOne({
      where: {
        username,
      },
    });

    // If non-found, throw error
    if (!user) {
      throw new UserNotFoundAuthError();
    }

    // Validate credentials
    const valid = await bcrypt.compare(password, user.password);

    // If non-valid credentials, throw error
    if (!valid) {
      throw new InvalidCredentialsAuthError();
    } else {
      // If valid credentials, check if user is verified
      // throw error if it's non-verified
      // TODO: set this as opt
      if (!user.verified_email) {
        throw new UserNotVerifiedAuthError();
      }
      // If verified email, check if user is banned/active
      if (!user.active) {
        throw new UserIsBannedAuthError();
      }
    }
    return user;
  }

  /**
   * Register a new user and send a verification email
   * @param {object} data registration data
   * @param {string} data.email user's email
   * @param {string} data.username user's username
   * @param {string} data.password user's password
   * @param {string} data.name user's name
   * @param {string} token registration token (metadata of registration)
   * @throws {
   *  UserWasNotCreatedAuthError,
   *  InvalidPasswordEmptyAuthError,
   *  InvalidUsernameEmptyAuthError,
   *  InvalidUsernameCharactersAuthError,
   *  InvalidUsernameLengthAuthError,
   *  InvalidEmailAuthErrorAuthError
   * } authentication error
   * @returns {boolean} user successfully created
   */
  async register(
    {
      email,
      username,
      password,
      name,
    }: {
      email: string;
      username: string;
      password: string;
      name: string;
    },
    token?: string,
  ): Promise<{
    id: number;
    username: string;
  }> {
    // Validate email
    if (!validator.isEmail(email)) {
      throw new InvalidEmailAuthError();
    }
    // Validate username (non-empty)
    if (validator.isEmpty(username)) {
      throw new InvalidUsernameEmptyAuthError();
    }

    // Validate username (only strings, numbers and _, like twitter, at least 1 non-number)
    if (validator.isNumeric(username)) {
      throw new InvalidNumericUsernameCharactersAuthError();
    }
    if (!validator.matches(username, /^[a-zA-Z\d_]+$/gi)) {
      throw new InvalidUsernameCharactersAuthError();
    }

    // Validate username (length)
    if (!validator.isLength(username, { min: 4, max: 10 })) {
      throw new InvalidUsernameLengthAuthError();
    }
    // Validate password (non-empty)
    if (!password || validator.isEmpty(password)) {
      throw new InvalidPasswordEmptyAuthError();
    }
    // Validate password (length)
    if (!validator.isLength(password, { min: 8 })) {
      throw new InvalidPasswordLengthAuthError();
    }
    // Validate name
    if (validator.isEmpty(name.trim())) {
      throw new InvalidNameEmptyAuthError();
    }
    // Valid user data
    // Check token if there is one
    if (token) {
      try {
        const jwtPayload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        // TODO
        // check on payload for:
        // - invitation
        // - additional permissions
      } catch (e) {
        // Throw registration token error
        throw new InvalidRegistrationTokenAuthError();
      }
    }

    let user: User;

    // Create user
    try {
      log('register() - starting transaction');
      /**
       * Start transaction to create user and assign roles and permissions
       */
      const uow = this.databaseService.makeUnitOfWork();
      await uow.start();
      user = await uow.complete<User>(async () => {
        log('register() - work');
        const result = await this.usersService.create(
          UserFactory.create({
            email,
            name,
            username,
            password,
          }),
          uow,
        );
        await this.authRolesService.addRole(result, AuthRoles.NORMAL, uow);
        await this.authPermissionsService.addPermission(result, AuthPermissions.SIGN_IN, uow);
        await this.authPermissionsService.addPermission(result, AuthPermissions.SIGN_UP, uow);
        return result;
      });
      log('register() - completed transaction');
    } catch (error) {
      log('register() - error:', error);
      if (error instanceof UsernameAlreadyExistsUsersError) throw new UsernameAlreadyExistsAuthError();
      if (error instanceof EmailAlreadyExistsUsersError) throw new EmailAlreadyExistsAuthError();
      throw new UserWasNotCreatedAuthError(error);
    }

    try {
      log('register() - sending email to created user');
      await this.authEmailService.sendVerificationEmail(user.email, user.name, await this.createConfirmationUrl(user));
    } catch (error) {
      log('register() - emailing error', error);
      throw new EmailSendingAuthError();
    }

    /**
     * Return only the public data
     */
    return user?.getPublicNotSensitiveData();
  }

  /**
   * Check if an user is authorized to execute an action
   *
   * @param user {User} user trying to do the action
   * @param action {Action} the action being intended
   */
  async isAuthorized(user: User, permission: AuthPermission | AuthPermissionBasicModel): Promise<boolean> {
    if (permission instanceof AuthPermission) {
      const isAuthorized = await this.usersService.isAuthorized(user, permission);
      return isAuthorized;
    } else {
      const p = await this.authPermissionsService.readPermissionByDefinition(permission);
      const isAuthorized = await this.usersService.isAuthorized(user, p);
      return isAuthorized;
    }
  }

  /**
   * Verify a user
   * @param token verification token
   */
  async verify(token: string): Promise<User> {
    let jwtPayload;
    // Validate token
    try {
      jwtPayload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (e) {
      // Throw registration token error
      throw new InvalidVerificationTokenAuthError();
    }
    // Get user
    const user = await this.usersService.findOne({
      where: {
        username: jwtPayload['user'],
      },
    });
    // If user doesnt exist, throw error
    if (!user) {
      throw new InvalidVerificationTokenAuthError();
    }
    // Check if it's a verification token
    if (jwtPayload['verification'] !== true) {
      throw new InvalidVerificationTokenAuthError();
    }
    // Check if user is already verified
    if (user.verified_email) {
      throw new UserAlreadyVerifiedAuthError();
    }
    // It's a valid token, verify user
    const updatedUser = await this.usersService.update(user, {
      verified_email: true,
    });
    log('verify(), updated user:', updatedUser);
    return updatedUser;
  }

  /**
   * Creates a confirmation url based on the userId, this url
   * will be saved on redis awaiting for its confirmation.
   * @param userId
   */
  async createConfirmationUrl(user: User): Promise<string> {
    const token = this.jwtService.sign(
      {
        verification: true,
        user: user.username,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );
    return `${process.env.UI_URL}/verify?token=${token}`;
  }
}
