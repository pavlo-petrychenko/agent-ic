import { ErrorReason } from '@agent-ic/contracts';

export enum AccountField {
  Name = 'name',
  Email = 'email',
  Password = 'password',
  Locale = 'locale',
  Token = 'token',
}

export const INVALID_ACCOUNT_INPUT_MESSAGE = 'Some fields are not valid.';
export const TOO_BIG_ISSUE_CODE = 'too_big';

export const ACCOUNT_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [AccountField.Name]: ErrorReason.InvalidName,
  [AccountField.Email]: ErrorReason.InvalidEmail,
  [AccountField.Password]: ErrorReason.PasswordTooShort,
};

export const FIELD_PATH_SEPARATOR = '.';

export enum GraphqlArgument {
  Input = 'input',
}
