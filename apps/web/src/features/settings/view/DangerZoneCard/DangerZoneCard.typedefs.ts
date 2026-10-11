import type { DangerActionTone } from '@/features/settings/view/DangerZoneCard/DangerZoneCard.constants';

export interface DangerZoneRow {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly tone?: DangerActionTone;
  readonly disabled?: boolean;
  readonly onAction: (() => void) | null;
}

export interface DangerZoneCardProps {
  readonly title: string;
  readonly rows: readonly DangerZoneRow[];
}
