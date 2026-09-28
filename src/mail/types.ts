export type WelcomeEmailData = {
  name: string;
  verificationUrl: string;
};

export type EmailVerificationData = {
  name: string;
  verificationUrl: string;
};

export type PasswordResetEmailData = {
  name: string;
  resetUrl: string;
};

export type MailTemplateName = 'welcome' | 'email-verification' | 'password-reset';

export type MailTemplateDataMap = {
  welcome: WelcomeEmailData;
  'email-verification': EmailVerificationData;
  'password-reset': PasswordResetEmailData;
};

export type MailJobPayload<T extends MailTemplateName = MailTemplateName> = {
  to: string;
  subject: string;
  template: T;
  data: MailTemplateDataMap[T];
};
