// import { IsEmail, Length } from 'class-validator';
import { Field, InputType } from 'type-graphql';

import { User } from '../../users/user.entity';

@InputType()
export class SignupInput implements Partial<User> {
  @Field()
  // @Length(1, 255)
  public name: string;

  @Field()
  // @Length(4, 255)
  public username: string;

  @Field()
  // @IsEmail()
  public email: string;

  @Field()
  // @Length(8, 255)
  public password: string;
}
