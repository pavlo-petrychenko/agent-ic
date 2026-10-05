import type { ComponentProps } from 'react';
import type { WidgetPreviewMessageFrom } from '@/shared/ui/chat/WidgetPreview/WidgetPreview.constants';

export interface WidgetPreviewMessage {
  from: WidgetPreviewMessageFrom;
  text: string;
}

export interface WidgetPreviewProps extends Omit<ComponentProps<'div'>, 'children'> {
  stageLabel: string;
  name: string;
  subtitle: string | null;
  initials: string;
  accent: string;
  messages: readonly WidgetPreviewMessage[];
  typingLabel: string | null;
  open: boolean;
  onToggle: () => void;
  openLabel: string;
  closeLabel: string;
  composerPlaceholder: string;
  composerLabel: string;
  sendLabel: string;
}
