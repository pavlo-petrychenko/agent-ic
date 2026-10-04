export enum IconButtonVariant {
  Ghost = 'ghost',
  Secondary = 'secondary',
  Primary = 'primary',
}

export enum IconButtonSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export const ICON_BUTTON_ICON_SIZES: Readonly<Record<IconButtonSize, number>> = {
  [IconButtonSize.Xs]: 12,
  [IconButtonSize.Sm]: 14,
  [IconButtonSize.Md]: 15,
  [IconButtonSize.Lg]: 16,
};
