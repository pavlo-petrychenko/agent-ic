import type { ComponentProps } from 'react';
import type {
  IconButtonSize,
  IconButtonVariant,
} from '@/shared/ui/actions/IconButton/IconButton.constants';
import type { IconName } from '@/shared/ui/foundations/Icon';

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
