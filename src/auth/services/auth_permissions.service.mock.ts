export const authPermissionsServiceMock = {
  findAll: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  addPermission: jest.fn(),
  removePermission: jest.fn(),
  readPermissionByDefinition: jest.fn(),
  loadPermissions: jest.fn(),
};
