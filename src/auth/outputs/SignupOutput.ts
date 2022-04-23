import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class SignupOutput {
  @Field(message => String)
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
