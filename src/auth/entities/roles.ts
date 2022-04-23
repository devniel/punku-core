export interface AuthRoleBasicModel {
  code: string;
  definition: boolean; // to differ from an actual AuthRole instance
}

interface AuthRoleCollection {
  ADMIN: AuthRoleBasicModel,
  NORMAL: AuthRoleBasicModel,
}

export const AuthRoles: AuthRoleCollection = {
  ADMIN: {
    code: 'ADMIN',
    definition: true
  },
  NORMAL: {
    code: 'NORMAL',
    definition: true
  }
}