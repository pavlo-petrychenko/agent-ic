export const RESET_LINK_PATTERN = /https:\/\/\S+reset-password\?token=([A-Za-z0-9_-]+)/;
export const NEW_PASSWORD = 'a brand new passphrase';
export const OTHER_NEW_PASSWORD = 'another brand new passphrase';
export const PASSWORD_RESETS_PER_HOUR = 3;
export const FORGOT_PASSWORD_MUTATION = `
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input) { accepted }
  }
`;
