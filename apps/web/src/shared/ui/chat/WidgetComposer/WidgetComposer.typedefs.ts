import type { ComponentProps } from 'react';

export interface WidgetComposerAttach {
  label: string;
  onAttach: () => void;
}

export interface WidgetComposerProps extends Omit<ComponentProps<'div'>, 'children' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  attach: WidgetComposerAttach | null;
  placeholder: string;
  messageLabel: string;
  sendLabel: string;
  accent: string;
  sending?: boolean;
  disabled?: boolean;
}
