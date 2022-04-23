import { Field, ObjectType } from 'type-graphql';

import { User } from '../../users/user.entity';

@ObjectType()
export class SigninOutput {
  @Field(type => User)
  user: User;

  @Field({ nullable: false })
  access_token: string;
}
