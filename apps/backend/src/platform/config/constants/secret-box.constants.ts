export const SECRET_BOX_KEY_BYTES = 32;
export const SECRET_BOX_KEY_PATTERN = new RegExp(`^[0-9a-fA-F]{${SECRET_BOX_KEY_BYTES * 2}}$`);
export const SECRET_BOX_KEY_VERSION_MIN = 1;
export const SECRET_BOX_PREVIOUS_KEYS_SEPARATOR = ',';
export const SECRET_BOX_KEY_VERSION_SEPARATOR = ':';
export const SECRET_BOX_KEY_MESSAGE = `must be ${SECRET_BOX_KEY_BYTES} bytes written as hex`;
export const SECRET_BOX_PREVIOUS_KEYS_MESSAGE = `must be comma-separated version:key pairs, each key ${SECRET_BOX_KEY_BYTES} bytes written as hex`;
export const SECRET_BOX_DUPLICATE_VERSION_MESSAGE =
  'every key version must be unique, the current one included';
