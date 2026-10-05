import type { ComponentProps, ReactNode } from 'react';
import type { IconName } from '@/shared/ui/Icon';
import type { NodeKind } from '@/shared/ui/NodeTile';

export interface InspectorKind {
  label: string;
  kind: NodeKind;
  icon?: IconName | null;
}

export interface InspectorProps extends Omit<ComponentProps<'aside'>, 'title' | 'aria-label'> {
  kind: InspectorKind;
  title: string;
  subtitle?: string | null;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}
