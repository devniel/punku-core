import { Field } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AuthRole extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column('text', { unique: true })
  code: string;

  @Field()
  @Column({ default: null, nullable: true })
  description?: string;

  @BeforeInsert()
  async setCode(): Promise<void> {
    this.code = this.code.toUpperCase();
  }
}
