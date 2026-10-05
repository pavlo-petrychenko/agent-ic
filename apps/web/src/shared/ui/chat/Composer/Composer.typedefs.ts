import type { ComponentProps } from 'react';

export interface ComposerProps extends Omit<ComponentProps<'div'>, 'children' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onRetry: (() => void) | null;
  placeholder: string;
  label: string;
  sendLabel: string;
  retryLabel: string;
  sending?: boolean;
  error?: string | null;
  disabled?: boolean;
  disabledReason?: string | null;
}
