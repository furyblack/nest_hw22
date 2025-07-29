import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    //can add html templates, implement advertising and other logic for mailing...
    await this.mailerService.sendMail({
      from: 'Miha <miha25-2010@mail.ru>',
      to: email,
      subject: `Please confirm your registration`,
      text: `confirm registration via link https://some.com?code=${code}`,
    });
  }
}
