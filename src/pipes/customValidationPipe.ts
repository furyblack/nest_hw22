import {
  BadRequestException,
  Injectable,
  ValidationPipe,
  ValidationError,
} from '@nestjs/common';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const errorsMessages = errors.map((err) => {
          const firstConstraint = Object.values(err.constraints || {})[0];
          return {
            message: firstConstraint,
            field: err.property,
          };
        });
        return new BadRequestException({ errorsMessages });
      },
    });
  }
}
