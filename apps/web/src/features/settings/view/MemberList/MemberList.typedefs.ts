import type { MemberAction } from '@/features/settings/constants/member.constants';
import type { MemberRow } from '@/features/settings/typedefs/member.typedefs';

export interface MemberListProps {
  rows: readonly MemberRow[];
  onAction: (rowId: string, action: MemberAction) => void;
}
