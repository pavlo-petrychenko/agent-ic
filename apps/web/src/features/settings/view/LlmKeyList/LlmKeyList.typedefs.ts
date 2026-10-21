import type { ReactNode } from 'react';
import type { BadgeTone } from '@/shared/ui/display/Badge';

export interface LlmKeyBadge {
  readonly label: string;
  readonly tone: BadgeTone;
  readonly dot: boolean;
}

export interface LlmKeyRow {
  readonly id: string;
  readonly title: string;
  readonly subtitle: ReactNode;
  readonly badge: LlmKeyBadge | null;
  readonly control: ReactNode | null;
  readonly addLabel: string | null;
  readonly onAdd: (() => void) | null;
  readonly removeLabel: string | null;
  readonly onRemove: (() => void) | null;
}

export interface LlmKeyListProps {
  readonly title: string;
  readonly description: string;
  readonly rows: readonly LlmKeyRow[];
}
