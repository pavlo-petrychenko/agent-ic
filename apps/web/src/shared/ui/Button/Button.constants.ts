export enum ButtonVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Danger = 'danger',
  Ghost = 'ghost',
}

export enum ButtonSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export const BUTTON_ICON_SIZES: Readonly<Record<ButtonSize, number>> = {
  [ButtonSize.Sm]: 13,
  [ButtonSize.Md]: 13,
  [ButtonSize.Lg]: 14,
};

export const BUTTON_SPINNER_SIZE = 13;
export const BUTTON_SPINNER_STROKE_WIDTH = 1.8;
