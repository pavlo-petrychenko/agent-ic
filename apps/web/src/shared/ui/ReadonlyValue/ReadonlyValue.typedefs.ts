import type { ComponentProps } from 'react';

export interface ReadonlyValueProps extends ComponentProps<'div'> {
  mono?: boolean;
  copyText?: string | null;
  copyLabel?: string | null;
}

export interface ReadonlyValueCopy {
  copied: boolean;
  copy: () => void;
}
