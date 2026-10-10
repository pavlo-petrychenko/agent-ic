export const SECRET_BOX_ALGORITHM = 'aes-256-gcm';
export const SECRET_BOX_IV_BYTES = 12;
export const SECRET_BOX_AUTH_TAG_BYTES = 16;
export const SECRET_BOX_KEY_ENCODING = 'hex';
export const SECRET_BOX_PLAINTEXT_ENCODING = 'utf8';
export const SEALED_PART_ENCODING = 'base64url';
export const SEALED_PART_SEPARATOR = '.';
export const SEALED_VERSION_PREFIX = 'v';
export const SEALED_VERSION_PATTERN = /^v([1-9][0-9]*)$/;
export const SEALED_PART_PATTERN = /^[A-Za-z0-9_-]*$/;
export const SEALED_PART_COUNT = 4;
export const SECRET_KEY_VERSION_UNKNOWN_MESSAGE =
  'The secret was sealed with an unknown key version.';
export const SECRET_TAMPERED_MESSAGE = 'The sealed secret is malformed or was changed.';
