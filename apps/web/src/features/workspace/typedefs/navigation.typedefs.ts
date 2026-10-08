import type { PermissionResource } from '@agent-ic/contracts';
import type {
  NavGroupKey,
  WorkspaceSection,
} from '@/features/workspace/constants/navigation.constants';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface NavEntry {
  readonly section: WorkspaceSection;
  readonly icon: IconName;
  readonly resource: PermissionResource | null;
}

export interface NavGroupEntry {
  readonly key: NavGroupKey;
  readonly entries: readonly NavEntry[];
}

export type PlaceholderSection = Exclude<
  WorkspaceSection,
  WorkspaceSection.Team | WorkspaceSection.General
>;
