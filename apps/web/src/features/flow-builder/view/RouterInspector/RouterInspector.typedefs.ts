import type { FlowIssue } from '@agent-ic/flow';
import type { IssuePathSegment } from '@/features/flow-builder/constants/inspector.constants';
import type {
  ConditionPatch,
  FieldRow,
  PortTarget,
  RouteView,
} from '@/features/flow-builder/typedefs/inspector.typedefs';

export interface RouterInspectorProps {
  routes: readonly RouteView[];
  fields: readonly FieldRow[];
  otherwise: readonly PortTarget[];
  backgroundSteps: readonly string[];
  ruleError: (ruleIndex: number, segment: IssuePathSegment) => FlowIssue | null;
  conditionError: (
    ruleIndex: number,
    conditionIndex: number,
    segment: IssuePathSegment,
  ) => FlowIssue | null;
  canAddRoute: boolean;
  onAddRoute: () => void;
  onRenameRoute: (ruleId: string, label: string) => void;
  onMoveRoute: (ruleId: string, offset: number) => void;
  onRemoveRoute: (ruleId: string) => void;
  onConditionChange: (ruleId: string, index: number, patch: ConditionPatch) => void;
}
