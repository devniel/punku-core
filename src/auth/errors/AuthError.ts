import { ApolloError } from 'apollo-server-core';

import errors, { AppError } from '.';

export default class AuthError extends ApolloError {
  constructor(appError: AppError, additionalProperties?: any) {
    super(appError.message, appError.code, additionalProperties);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * TODO: rename to AuthUnexpectedError
 */
export class UserWasNotCreatedAuthError extends AuthError {
  constructor(e?) {
    super(errors.USER_WAS_NOT_CREATED);
    Object.setPrototypeOf(this, UserWasNotCreatedAuthError.prototype);
    if (e) {
      this.stack =
        this.stack
          .split('\n')
          .slice(0, 2)
          .join('\n') +
        '\n' +
        e.stack;
    }
  }
}

export class UserNotFoundAuthError extends AuthError {
  constructor() {
    super(errors.USER_NOT_FOUND);
    Object.setPrototypeOf(this, UserNotFoundAuthError.prototype);
  }
}

export class UserNotSavedAuthError extends AuthError {
  constructor() {
    super(errors.USER_NOT_SAVED);
    Object.setPrototypeOf(this, UserNotSavedAuthError.prototype);
  }
}

export class UsernameAlreadyExistsAuthError extends AuthError {
  constructor() {
    super(errors.USERNAME_ALREADY_EXISTS);
    Object.setPrototypeOf(this, UsernameAlreadyExistsAuthError.prototype);
  }
}

export class EmailAlreadyExistsAuthError extends AuthError {
  constructor() {
    super(errors.EMAIL_ALREADY_EXISTS);
    Object.setPrototypeOf(this, EmailAlreadyExistsAuthError.prototype);
  }
}

export class InvalidCredentialsAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_CREDENTIALS);
    Object.setPrototypeOf(this, InvalidCredentialsAuthError.prototype);
  }
}

export class InvalidIDAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_ID);
    Object.setPrototypeOf(this, InvalidIDAuthError.prototype);
  }
}

export class InvalidEmailAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_EMAIL);
    Object.setPrototypeOf(this, InvalidEmailAuthError.prototype);
  }
}

export class InvalidUsernameEmptyAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_USERNAME_EMPTY);
    Object.setPrototypeOf(this, InvalidUsernameEmptyAuthError.prototype);
  }
}

export class InvalidNumericUsernameCharactersAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_NUMERIC_USERNAME_CHARACTERS);
    Object.setPrototypeOf(this, InvalidNumericUsernameCharactersAuthError.prototype);
  }
}
export class InvalidUsernameCharactersAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_USERNAME_CHARACTERS);
    Object.setPrototypeOf(this, InvalidUsernameCharactersAuthError.prototype);
  }
}

export class InvalidUsernameLengthAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_USERNAME_LENGTH);
    Object.setPrototypeOf(this, InvalidUsernameLengthAuthError.prototype);
  }
}

export class InvalidPasswordLengthAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_PASSWORD_LENGTH);
    Object.setPrototypeOf(this, InvalidPasswordLengthAuthError.prototype);
  }
}

export class InvalidPasswordEmptyAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_PASSWORD_EMPTY);
    Object.setPrototypeOf(this, InvalidPasswordEmptyAuthError.prototype);
  }
}

export class InvalidRegistrationTokenAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_REGISTRATTION_TOKEN);
    Object.setPrototypeOf(this, InvalidRegistrationTokenAuthError.prototype);
  }
}

export class InvalidVerificationTokenAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_VERIFICATION_TOKEN);
    Object.setPrototypeOf(this, InvalidVerificationTokenAuthError.prototype);
  }
}

export class InvalidNameEmptyAuthError extends AuthError {
  constructor() {
    super(errors.INVALID_NAME_EMPTY);
    Object.setPrototypeOf(this, InvalidNameEmptyAuthError.prototype);
  }
}

export class UserNotVerifiedAuthError extends AuthError {
  constructor() {
    super(errors.USER_NOT_VERIFIED);
    Object.setPrototypeOf(this, UserNotVerifiedAuthError.prototype);
  }
}

export class UserIsBannedAuthError extends AuthError {
  constructor() {
    super(errors.USER_IS_BANNED);
    Object.setPrototypeOf(this, UserIsBannedAuthError.prototype);
  }
}

export class UserAlreadyVerifiedAuthError extends AuthError {
  constructor() {
    super(errors.USER_ALREADY_VERIFIED);
    Object.setPrototypeOf(this, UserAlreadyVerifiedAuthError.prototype);
  }
}

export class AuthRoleAlreadyExistsAuthError extends AuthError {
  constructor() {
    super(errors.AUTH_ROLE_ALREADY_EXISTS);
    Object.setPrototypeOf(this, AuthRoleAlreadyExistsAuthError.prototype);
  }
}

export class AuthPermissionAlreadyExistsAuthError extends AuthError {
  constructor() {
    super(errors.AUTH_PERMISSION_ALREADY_EXISTS);
    Object.setPrototypeOf(this, AuthPermissionAlreadyExistsAuthError.prototype);
  }
}

export class EmailSendingAuthError extends AuthError {
  constructor() {
    super(errors.EMAIL_SENDING_ERROR);
    Object.setPrototypeOf(this, EmailSendingAuthError.prototype);
  }
}
