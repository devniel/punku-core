export const authServiceMock = {
  sendEmail: jest.fn(),
  createConfirmationUrl: jest.fn(),
  authenticate: jest.fn(),
  register: jest.fn(),
  isAuthorized: jest.fn(),
  verify: jest.fn(),
  sendVerificationEmail: jest.fn(),
};
