import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    console.log('CurrentUser decorator2:', request.user);

    if (!request.user) return null;

    return data ? request.user[data] : request.user.id; // Возвращаем только userId
  },
);
