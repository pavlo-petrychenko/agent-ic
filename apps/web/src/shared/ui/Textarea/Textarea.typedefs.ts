import type { ComponentProps } from 'react';

export interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean;
  mono?: boolean;
}
