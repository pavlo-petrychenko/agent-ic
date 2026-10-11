import type { FlowIssue } from '@agent-ic/flow';
import type { IssuePathSegment } from '@/features/flow-builder/constants/inspector.constants';
import type {
  ConditionPatch,
  RouteView,
} from '@/features/flow-builder/typedefs/inspector.typedefs';

export interface RouteCardProps {
  index: number;
  total: number;
  route: RouteView;
  fieldOptions: readonly string[];
  ruleError: (segment: IssuePathSegment) => FlowIssue | null;
  conditionError: (index: number, segment: IssuePathSegment) => FlowIssue | null;
  onRename: (label: string) => void;
  onMove: (offset: number) => void;
  onRemove: () => void;
  onConditionChange: (index: number, patch: ConditionPatch) => void;
}

export interface ValueDraft {
  base: string;
  value: string;
}
