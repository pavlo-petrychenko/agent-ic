import type { GuideId } from '@/features/flow-builder/constants/guide.constants';
import type { GuideListSection } from '@/features/flow-builder/typedefs/guide.typedefs';

export interface GuideListProps {
  sections: readonly GuideListSection[];
  query: string;
  focusId: GuideId | null;
  onQueryChange: (query: string) => void;
  onSelect: (id: GuideId) => void;
  onClose: () => void;
}
