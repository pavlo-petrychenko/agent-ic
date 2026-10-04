import type { ComponentProps } from 'react';
import type { IconName } from '@/shared/ui/Icon';
import type {
  IconButtonSize,
  IconButtonVariant,
} from '@/shared/ui/IconButton/IconButton.constants';

export interface IconButtonOwnProps {
  icon: IconName;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  disabled?: boolean;
}

export interface IconButtonElementProps
  extends Omit<ComponentProps<'button'>, 'aria-label' | 'children'>, IconButtonOwnProps {
  href?: null;
}

export interface IconButtonAnchorProps
  extends Omit<ComponentProps<'a'>, 'href' | 'aria-label' | 'children'>, IconButtonOwnProps {
  href: string;
}

export type IconButtonProps = IconButtonElementProps | IconButtonAnchorProps;
