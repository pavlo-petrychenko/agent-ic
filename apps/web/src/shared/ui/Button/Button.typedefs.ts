import type { ComponentProps } from 'react';

import type { ButtonSize, ButtonVariant } from './Button.constants';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}
