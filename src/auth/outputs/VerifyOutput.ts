import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class VerifyOutput {
  @Field(message => String)
  message: string;

  @Field(success => Boolean)
  success?: boolean;

  constructor(message?: string, success?: boolean) {
    this.message = message;
    this.success = success;
  }
}
