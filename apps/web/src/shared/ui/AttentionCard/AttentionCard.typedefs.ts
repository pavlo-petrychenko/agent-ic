import type { ComponentProps } from 'react';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';

export interface AttentionCardAction {
  label: string;
  href: string;
}

export interface AttentionCardRow {
  id: string;
  icon: IconName;
  title: string;
  tone?: NodeKind;
  meta?: string | null;
  action?: AttentionCardAction | null;
}

export interface AttentionCardProps extends Omit<ComponentProps<'section'>, 'title' | 'children'> {
  title: string;
  rows: readonly AttentionCardRow[];
  loading?: boolean;
}
