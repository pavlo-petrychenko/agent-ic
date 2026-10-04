import type { ComponentProps } from 'react';
import type { ButtonSize, ButtonVariant } from '@/shared/ui/Button/Button.constants';
import type { IconName } from '@/shared/ui/Icon';

export interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: IconName | null;
  fullWidth?: boolean;
  disabled?: boolean;
}

export interface ButtonElementProps extends ComponentProps<'button'>, ButtonOwnProps {
  href?: null;
}

export interface ButtonAnchorProps extends Omit<ComponentProps<'a'>, 'href'>, ButtonOwnProps {
  href: string;
}

export type ButtonProps = ButtonElementProps | ButtonAnchorProps;
