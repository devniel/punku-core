export const jwtServiceMock = {
  sign: jest.fn(value => value),
  verify: jest.fn(),
};
