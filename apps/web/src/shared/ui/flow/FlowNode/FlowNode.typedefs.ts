import type { ComponentProps, ReactNode } from 'react';
import type { CalloutTone } from '@/shared/ui/display/Callout/Callout.constants';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { TagKind } from '@/shared/ui/display/Tag/Tag.constants';
import type { FlowNodeSize } from '@/shared/ui/flow/FlowNode/FlowNode.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface FlowNodeChip {
  id: string;
  label: string;
  kind?: TagKind;
}

export interface FlowNodeCallout {
  tone: CalloutTone;
  text: string;
}

export interface FlowNodeProps extends Omit<ComponentProps<'div'>, 'children' | 'title'> {
  kind: NodeKind;
  overline: string;
  name: string;
  icon?: IconName | null;
  meta?: string | null;
  chips?: readonly FlowNodeChip[];
  output?: string | null;
  callout?: FlowNodeCallout | null;
  size?: FlowNodeSize;
  selected?: boolean;
  faded?: boolean;
  disabled?: boolean;
  invalidLabel?: string | null;
  inPort?: ReactNode | null;
  outPorts?: ReactNode | null;
}
