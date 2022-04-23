import errors from '.';

export default class UsersError extends Error {
  constructor(m: string) {
    super(m);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UsersError.prototype);
  }
}

export class UserWasNotCreatedUsersError extends Error {
  constructor() {
    super(errors.USER_WAS_NOT_CREATED);
    Object.setPrototypeOf(this, UserWasNotCreatedUsersError.prototype);
  }
}

export class UserNotFoundUsersError extends UsersError {
  constructor() {
    super(errors.USER_NOT_FOUND);
    Object.setPrototypeOf(this, UserNotFoundUsersError.prototype);
  }
}

export class UserNotSavedUsersError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, UserNotSavedUsersError.prototype);
  }
}

export class UsernameAlreadyExistsUsersError extends Error {
  constructor() {
    super(errors.USERNAME_ALREADY_EXISTS);
    Object.setPrototypeOf(this, UsernameAlreadyExistsUsersError.prototype);
  }
}

export class EmailAlreadyExistsUsersError extends Error {
  constructor() {
    super(errors.EMAIL_ALREADY_EXISTS);
    Object.setPrototypeOf(this, EmailAlreadyExistsUsersError.prototype);
  }
}

export class InvalidCredentialsUsersError extends UsersError {
  constructor() {
    super(errors.INVALID_CREDENTIALS);
    Object.setPrototypeOf(this, InvalidCredentialsUsersError.prototype);
  }
}

export class InvalidIDUsersError extends UsersError {
  constructor() {
    super(errors.INVALID_CREDENTIALS);
    Object.setPrototypeOf(this, InvalidIDUsersError.prototype);
  }
}

export class InvalidEmailUsersError extends UsersError {
  constructor() {
    super(errors.INVALID_CREDENTIALS);
    Object.setPrototypeOf(this, InvalidEmailUsersError.prototype);
  }
}

export class UserNotVerifiedUsersError extends UsersError {
  constructor() {
    super(errors.INVALID_CREDENTIALS);
    Object.setPrototypeOf(this, UserNotVerifiedUsersError.prototype);
  }
}

export class UserIsBannedUsersError extends UsersError {
  constructor() {
    super(errors.INVALID_CREDENTIALS);
    Object.setPrototypeOf(this, UserIsBannedUsersError.prototype);
  }
}

export class UserAlreadyVerifiedUsersError extends UsersError {
  constructor() {
    super(errors.INVALID_CREDENTIALS);
    Object.setPrototypeOf(this, UserAlreadyVerifiedUsersError.prototype);
  }
}
