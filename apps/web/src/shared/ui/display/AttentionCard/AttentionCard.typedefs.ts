import type { ComponentProps } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

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
