/**
 * Mail Service
 * ------------
 * Service for sending emails using Nodemailer with Handlebars templates.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface MailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: this.configService.get<boolean>('mail.secure'),
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.password'),
      },
    });

    // Verify connection
    this.transporter.verify().then(() => {
      this.logger.log('Mail transporter initialized successfully');
    }).catch((error) => {
        this.logger.warn(
          `Mail transporter verification failed: ${error.message}`,
        );
    });
  }

  private loadTemplates(): void {
    // In dev mode: dist/src/shared/mail -> go up 3 levels -> dist/ -> templates/mail
    // In production: dist/shared/mail -> go up 2 levels -> dist/ -> templates/mail
    // We're using the src structure, so need to go up 3 levels
    const templatesDir = path.join(__dirname, '..', '..', '..', 'templates', 'mail');
    this.logger.log(`Looking for templates in: ${templatesDir}`);
    this.logger.log(`__dirname is: ${__dirname}`);

    try {
      if (!fs.existsSync(templatesDir)) {
        this.logger.warn(`Templates directory does not exist: ${templatesDir}`);
        fs.mkdirSync(templatesDir, { recursive: true });
        this.logger.log(`Created templates directory: ${templatesDir}`);
      }

      const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.hbs'));
      this.logger.log(`Found ${templateFiles.length} template files: ${templateFiles.join(', ')}`);
      
      for (const file of templateFiles) {
        const templateName = path.basename(file, '.hbs');
        const templatePath = path.join(templatesDir, file);
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        this.templates.set(templateName, handlebars.compile(templateSource));
        this.logger.log(`Loaded email template: ${templateName}`);
      }
    } catch (error) {
      this.logger.error(`Could not load templates: ${error}`);
    }
  }

  private getTemplate(name: string): handlebars.TemplateDelegate {
    const template = this.templates.get(name);
    if (!template) {
      // Fallback: try to load template on-demand
      const templatesDir = path.join(__dirname, '..', '..', 'templates', 'mail');
      const templatePath = path.join(templatesDir, `${name}.hbs`);
      
      if (fs.existsSync(templatePath)) {
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const compiledTemplate = handlebars.compile(templateSource);
        this.templates.set(name, compiledTemplate);
        return compiledTemplate;
      }
      
      throw new Error(`Email template '${name}' not found`);
    }
    return template;
  }

  async sendMail(options: MailOptions): Promise<void> {
    try {
      const template = this.getTemplate(options.template);
      const html = template(options.context);

      await this.transporter.sendMail({
        from: this.configService.get<string>('mail.from'),
        to: options.to,
        subject: options.subject,
        html,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error}`);
      throw error;
    }
  }
}
