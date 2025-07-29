import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.mail.ru',
        auth: {
          user: 'miha25-2010@mail.ru', // Ваш email sergeev.miha@internet.ru
          pass: '5ZxK2mBji7EuM3yAxTeM', // Ваш пароль от email  simplepass11
        },
      },
    }),
  ],

  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
