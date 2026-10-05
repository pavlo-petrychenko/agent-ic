import type { SourceKind } from '@/shared/ui/SourceBadges/SourceBadges.constants';

export interface SourceBadgeItem {
  kind: SourceKind;
  label: string;
}

export interface SourceBadgesProps {
  sources: readonly SourceBadgeItem[];
  ariaLabel?: string | null;
  className?: string;
}
