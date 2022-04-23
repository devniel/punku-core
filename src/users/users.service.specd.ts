import {
  EmailAlreadyExistsUsersError,
  InvalidCredentialsUsersError,
  InvalidEmailUsersError,
  InvalidIDUsersError,
  UserAlreadyVerifiedUsersError,
  UserIsBannedUsersError,
  UsernameAlreadyExistsUsersError,
  UserNotFoundUsersError,
  UserNotSavedUsersError,
  UserNotVerifiedUsersError,
  UserWasNotCreatedUsersError,
} from './errors/UserError';

export const authSpec = {
  features: [
    {
      toThrow: UserWasNotCreatedUsersError,
      when: 'there are problems while creating the user',
      flow: async ({ usersRepositoryMock, authService, usersService }) => {
        const user = {
          email: 'test@test.com',
          name: 'test',
          username: 'test',
          password: 'test',
        };
        usersRepositoryMock.save.mockImplementation(() => Promise.reject(new Error()));
        usersRepositoryMock.save.mockClear();
        await expect(authService.signUp({ ...user })).rejects.toThrow(UserWasNotCreatedUsersError);
        expect(usersRepositoryMock.save).toHaveBeenCalledWith(user);
      },
    },
    {
      toThrow: UserNotFoundUsersError,
      when: 'authenticating an unexistent user',
      flow: async ({ usersRepositoryMock, authService, usersService }) => {
        const user = {
          username: 'test',
          password: 'test',
        };
        const query = {
          where: {
            username: user.username,
          },
        };
        usersRepositoryMock.findOne.mockReturnValue(null);
        usersRepositoryMock.findOne.mockClear();
        await expect(authService.signIn(user.username, user.password)).rejects.toThrow(UserNotFoundUsersError);
        expect(usersRepositoryMock.findOne).toHaveBeenCalledWith(query);
      },
    },
    {
      toThrow: UserNotSavedUsersError,
      when: 'there are problems while saving user data while updating user',
      pending: true,
      flow: async ({ usersRepositoryMock, authService, usersService }) => {
        const user = {
          email: 'test@test.com',
          name: 'test',
          username: 'test',
          password: 'test',
        };
        usersRepositoryMock.update.mockImplementation(() => Promise.reject(new Error()));
        usersRepositoryMock.update.mockClear();
        await expect(authService.signUp({ ...user })).rejects.toThrow(UserWasNotCreatedUsersError);
        expect(usersRepositoryMock.save).toHaveBeenCalledWith(user);
      },
    },
    {
      toThrow: UsernameAlreadyExistsUsersError,
      when: 'the username already exists while registering',
    },
    {
      toThrow: EmailAlreadyExistsUsersError,
      when: 'the email already exists while registering',
    },
    {
      toThrow: InvalidCredentialsUsersError,
      when: 'there are invalid credentials while authenticating',
      flow: async ({ usersRepositoryMock, authService, usersService }) => {
        const user = {
          username: 'test',
          password: 'test',
        };
        const query = {
          where: {
            username: user.username,
          },
        };
        usersRepositoryMock.findOne.mockReturnValue(user);
        usersRepositoryMock.findOne.mockClear();
        await expect(authService.signIn(user.username, 'badpassword')).rejects.toThrow(InvalidCredentialsUsersError);
        expect(usersRepositoryMock.findOne).toHaveBeenCalledWith(query);
      },
    },
    {
      toThrow: InvalidIDUsersError,
      when: 'there is an invalid id being used',
    },
    {
      toThrow: InvalidEmailUsersError,
      when: 'there is an invalid email being used',
    },
    {
      toThrow: UserNotVerifiedUsersError,
      when: 'user is not verified while authenticating',
    },
    {
      toThrow: UserIsBannedUsersError,
      when: 'user is banned while authenticatend',
    },
    {
      toThrow: UserAlreadyVerifiedUsersError,
      when: 'user is already verified while verifying',
    },
  ],
};
