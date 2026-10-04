export enum EmailUpstream {
  Smtp = 'smtp',
  Resend = 'resend',
}

export const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
export const RESEND_CONTENT_TYPE = 'application/json';
export const BEARER_PREFIX = 'Bearer ';
