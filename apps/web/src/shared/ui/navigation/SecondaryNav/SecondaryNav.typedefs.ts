import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import type { HeadingElement } from '@/shared/ui/typography/Heading';

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
