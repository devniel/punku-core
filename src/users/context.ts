import { Request } from 'express';

import { User } from './user.entity';

interface MyRequest extends Request {
  user: User;
}
export interface MyContext {
  req: MyRequest;
}
