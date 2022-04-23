import { Injectable } from '@nestjs/common';
import * as mail from '@sendgrid/mail';
import debug from 'debug';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import * as path from 'path';

import { DatabaseService } from '../../database/database.service';
import { UsersService } from '../../users/users.service';

const log = debug('app:AuthService');

@Injectable()
export class AuthEmailService {
  APP_NAME = 'youl';
  APP_DOMAIN = 'youl.app';
  APP_EMAIL = 'hello@youl.app';

  constructor(private readonly databaseService: DatabaseService, private readonly usersService: UsersService) {}

  /**
   * Sends a verification email to the given target
   * @param email
   * @param url
   */
  async sendVerificationEmail(email: string, name: string, url: string): Promise<void> {
    const template = fs.readFileSync(path.join(__dirname, '../templates/email_verification.html'), 'utf8');

    const TEXT = handlebars.compile(
      `Your ${this.APP_NAME} is waiting for you, but please, first verify your email by visiting this link: ${url} .`.trim(),
      { strict: true },
    )({
      url,
      name,
    });

    const HTML = handlebars.compile(template, { strict: true })({
      url,
      name,
    });

    const SUBJECT =
      process.env.APP_ENV === 'production'
        ? `Hi, please verify your email − ${this.APP_NAME}`
        : `Hi, please verify your email − ${this.APP_NAME} (${process.env.APP_ENV})`;

    const FROM = `"${this.APP_NAME} " <${this.APP_EMAIL}>`;

    if (process.env.NODE_ENV !== 'production') {
      const account = await nodemailer.createTestAccount();

      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: account.user, // generated ethereal user
          pass: account.pass, // generated ethereal password
        },
      });

      const mailOptions = {
        from: FROM, // sender address
        to: email, // list of receivers
        subject: SUBJECT,
        text: TEXT,
        html: HTML,
      };

      const info = await transporter.sendMail(mailOptions);

      log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } else {
      mail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: email,
        from: FROM,
        subject: SUBJECT,
        text: TEXT,
        html: HTML,
      };

      mail.send(msg);
    }
  }
}
