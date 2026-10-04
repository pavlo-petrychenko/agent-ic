import { EnvVar } from '@/platform/config/constants/env.constants';
import { TEST_ENV } from '@test/support/constants/test-env.constants';

export const SIGN_UP_MUTATION = `
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) { email }
  }
`;

export const RESEND_CONFIRMATION_MUTATION = `
  mutation Resend($input: ResendConfirmationInput!) {
    resendConfirmation(input: $input) { accepted }
  }
`;

export const ME_QUERY = '{ me { id email name locale } }';

export const FORWARDED_FOR_HEADER = 'x-forwarded-for';
export const EXPIRED_COOKIE_DATE = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT';
export const REFRESH_COOKIE_ATTRIBUTES = [
  'Path=/api/auth',
  'HttpOnly',
  'Secure',
  'SameSite=Strict',
];

export const APP_ORIGIN = new URL(TEST_ENV[EnvVar.PublicUrl]).origin;
export const CROSS_SITE_ORIGIN = 'https://attacker.example';
export const JSON_CONTENT_TYPE = 'application/json';
export const FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded';
export const TEXT_CONTENT_TYPE = 'text/plain';
export enum FetchSite {
  SameOrigin = 'same-origin',
  CrossSite = 'cross-site',
}
export const PUBLIC_CLIENT_NETWORK = '203.0.113';
export const CLUSTER_POD_NETWORK = '10.42.0';
export const FORWARDED_FOR_SEPARATOR = ', ';
export const IPV4_OCTET_MAX = 254;
