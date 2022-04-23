export interface AuthPermissionBasicModel {
  code: string;
  definition: boolean; // to differ from an actual AuthPermission instance
}

interface AuthPermissionCollection {
  SIGN_IN: AuthPermissionBasicModel,
  SIGN_UP: AuthPermissionBasicModel,
}

export const AuthPermissions: AuthPermissionCollection = {
  SIGN_IN: {
    code: 'SIGN_IN',
    definition: true
  },
  SIGN_UP: {
    code: 'SIGN_UP',
    definition: true
  }
}