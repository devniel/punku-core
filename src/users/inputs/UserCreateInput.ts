import { IsEmail, Length } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class UserCreateInput {
  @Field()
  @Length(1, 255)
  public name: string;

  @Field()
  @Length(4, 255)
  public username: string;

  @Field()
  @IsEmail()
  public email: string;

  @Field()
  public password: string;
}
