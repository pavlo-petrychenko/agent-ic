import type { FlowIssue } from '@agent-ic/flow';
import type {
  ConditionPatch,
  RouteView,
} from '@/features/flow-builder/typedefs/inspector.typedefs';

export interface RouteCardProps {
  index: number;
  total: number;
  route: RouteView;
  fieldOptions: readonly string[];
  errorAt: (path: string) => FlowIssue | null;
  onRename: (label: string) => void;
  onMove: (offset: number) => void;
  onRemove: () => void;
  onConditionChange: (index: number, patch: ConditionPatch) => void;
}
