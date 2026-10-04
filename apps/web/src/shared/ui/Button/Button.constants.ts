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
