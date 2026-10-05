import type { HeadingElement } from '@/shared/ui/Heading';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';

export interface SecondaryNavAction {
  label: string;
  onClick: () => void;
}

export interface SecondaryNavItem {
  id: string;
  to: string;
  title: string;
  subtitle: string | null;
  monoTitle: boolean;
  tile: { icon: IconName | null; tone: NodeKind };
  selected: boolean;
}

export interface SecondaryNavGroup {
  id: string;
  label: string;
  action: SecondaryNavAction | null;
  items: readonly SecondaryNavItem[];
}

export interface SecondaryNavProps {
  title: string;
  ariaLabel: string;
  action: SecondaryNavAction | null;
  groups: readonly SecondaryNavGroup[];
  headingAs?: HeadingElement;
  className?: string;
}
