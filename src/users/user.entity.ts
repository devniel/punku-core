import * as bcrypt from 'bcrypt';
import { Field, ObjectType } from 'type-graphql';
//import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, BeforeInsert, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { AuthPermission } from '../auth/entities/AuthPermission.entity';
import { AuthRole } from '../auth/entities/AuthRole.entity';

export interface UserModel {
  id?: number;
  name: string;
  username: string;
  email: string;
  password: string;
  verified_email?: boolean;
}

export interface UserUpdateModel {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  verified_email?: boolean;
}

@ObjectType()
@Entity()
export class User extends BaseEntity implements UserModel {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column('text', { unique: true })
  username: string;

  @Field()
  @Column('text', { unique: true })
  email: string;

  @Column()
  password: string;

  @Field()
  @Column({ default: false })
  verified_email: boolean;

  @Field()
  @Column({ default: true })
  active: boolean;

  @ManyToMany(type => AuthRole, { eager: true })
  @JoinTable({
    name: 'user_auth_roles', // table name for the junction table of this relation
    joinColumn: {
      name: 'user',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'auth_role',
      referencedColumnName: 'id',
    },
  })
  auth_roles: AuthRole[];

  @ManyToMany(type => AuthPermission, { eager: true })
  @JoinTable({
    name: 'user_auth_permissions', // table name for the junction table of this relation
    joinColumn: {
      name: 'user',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'auth_permission',
      referencedColumnName: 'id',
    },
  })
  auth_permissions: AuthPermission[];

  /*
  @Field()
  public get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  */

  @BeforeInsert()
  async setPassword(): Promise<void> {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
  }

  /**
   * Returns the non-sensitive data of this user.
   */
  getPublicNotSensitiveData() {
    return {
      id: this.id,
      username: this.username,
    };
  }

  /**
   * Returns the JSON representation of the User
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      username: this.username,
      email: this.email,
      password: this.password,
      verified_email: this.verified_email,
      active: this.active,
      auth_roles: this.auth_roles,
      auth_permissions: this.auth_permissions,
    };
  }
}
