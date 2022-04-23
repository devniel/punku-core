import { AuthPermission } from '../auth/entities/AuthPermission.entity';
import { AuthRole } from '../auth/entities/AuthRole.entity';
import { User } from './../users/user.entity';

export function getOrmConfig() {
  let OrmConfig;
  const settings = {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT, 10),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
  };

  if (process.env.NODE_ENV !== 'test') {
    OrmConfig = {
      type: 'postgres',
      host: settings.host,
      port: settings.port,
      username: settings.username,
      password: settings.password,
      database: settings.database,
      entities: [User, AuthPermission, AuthRole],
      synchronize: true,
    };
  } else {
    OrmConfig = {
      type: 'sqlite',
      //database: './db/test-db.sql',
      database: ':memory:',
      dropSchema: true,
      entities: [User, AuthPermission, AuthRole],
      synchronize: true,
    };
  }
  return OrmConfig;
}
