export interface AppError {
  code: string;
  message: string;
}

export interface AppErrors {
  [key: string]: AppError;
}
const errors: AppErrors = {
  USER_WAS_NOT_CREATED: {
    code: 'user_was_not_created',
    message: 'User was not created',
  },
  USER_NOT_SAVED: {
    code: 'user_not_saved',
    message: 'User not saved',
  },
  USER_NOT_FOUND: {
    code: 'user_not_found',
    message: 'User not found',
  },
  USERNAME_ALREADY_EXISTS: {
    code: 'username_already_exists',
    message: 'Username already exists',
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'email_already_exists',
    message: 'Email already exists',
  },
  INVALID_CREDENTIALS: {
    code: 'invalid_credentials',
    message: 'Invalid credentials',
  },
  INVALID_REGISTRATTION_TOKEN: {
    code: 'invalid_registration_token',
    message: 'Invalid registration token',
  },
  INVALID_ID: {
    code: 'invalid_id',
    message: 'Invalid Id',
  },
  INVALID_EMAIL: {
    code: 'invalid_email',
    message: 'Invalid email',
  },
  INVALID_USERNAME_EMPTY: {
    code: 'invalid_username_empty',
    message: 'Invalid empty username',
  },
  INVALID_NUMERIC_USERNAME_CHARACTERS: {
    code: 'invalid_numeric_username_characters',
    message: 'Invalid username characters (include a non-number character)',
  },
  INVALID_USERNAME_CHARACTERS: {
    code: 'invalid_username_characters',
    message: "Invalid username characters, it can only contain letters, numbers and '_'",
  },
  INVALID_USERNAME_LENGTH: {
    code: 'invalid_username_length',
    message: 'Invalid username length',
  },
  INVALID_PASSWORD_LENGTH: {
    code: 'invalid_password_length',
    message: 'Invalid password length',
  },
  INVALID_PASSWORD_EMPTY: {
    code: 'invalid_password_empty',
    message: 'Invalid password empty',
  },
  INVALID_NAME_EMPTY: {
    code: 'invalid_name_empty',
    message: 'Invalid name empty',
  },
  INVALID_REGISTRATION_TOKEN: {
    code: 'invalid_registration_token',
    message: 'Invalid registration token',
  },
  USER_NOT_VERIFIED: {
    code: 'user_not_verified',
    message: 'User not verified',
  },
  USER_ALREADY_HAS_IDENTITY: {
    code: 'user_already_has_an_identity',
    message: 'User already has an identity',
  },
  USER_WITHOUT_IDENTITY: {
    code: 'user_without_identity',
    message: 'User without identity',
  },
  USER_IS_BANNED: {
    code: 'user_is_banned',
    message: 'User is banned',
  },
  USER_ALREADY_VERIFIED: {
    code: 'user_already_verified',
    message: 'User already verified',
  },
  AUTH_ROLE_ALREADY_EXISTS: {
    code: 'auth_role_already_exists',
    message: 'Role already exists',
  },
  AUTH_PERMISSION_ALREADY_EXISTS: {
    code: 'auth_permission_already_exists',
    message: 'Permission already exists',
  },
  INVALID_VERIFICATION_TOKEN: {
    code: 'invalid_verification_token',
    message: 'Invalid verification token',
  },
  EMAIL_SENDING_ERROR: {
    code: 'email_sending_error',
    message: 'Error while sending the email',
  },
};

export default errors;
