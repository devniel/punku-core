import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLExtension } from 'apollo-server-core';
import { TypeGraphQLModule } from 'typegraphql-nestjs';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import formatError from './utils/formatError';
import { Logging } from './utils/Logging';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    TypeGraphQLModule.forRoot({
      debug: true,
      playground: true,
      introspection: true,

      validate: true,
      dateScalarMode: 'timestamp',
      context: ({ req }) => ({ currentUser: req.user }),

      emitSchemaFile: true,
      //context: ({ req }) => ({ req }),
      extensions: [(): any => new Logging() as GraphQLExtension<any>],
      formatError,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export default class AppModule {}
