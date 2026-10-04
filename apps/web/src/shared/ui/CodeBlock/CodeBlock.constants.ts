export enum CodeTone {
  Light = 'light',
  Dark = 'dark',
}

export const CODE_BLOCK_WRAP_BY_DEFAULT: Readonly<Record<CodeTone, boolean>> = {
  [CodeTone.Light]: true,
  [CodeTone.Dark]: false,
};

export const CODE_BLOCK_COPIED_RESET_MS = 1500;
export const CODE_BLOCK_COPY_ICON_SIZE = 14;
