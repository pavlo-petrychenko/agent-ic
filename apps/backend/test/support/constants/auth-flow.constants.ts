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
