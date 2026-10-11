import type {
  ConditionPatch,
  FieldErrors,
  FieldRow,
  PortTarget,
  RouteView,
} from '@/features/flow-builder/typedefs/inspector.typedefs';

export interface RouterInspectorProps {
  routes: readonly RouteView[];
  fields: readonly FieldRow[];
  otherwise: readonly PortTarget[];
  observers: readonly string[];
  errors: FieldErrors;
  canAddRoute: boolean;
  onAddRoute: () => void;
  onRenameRoute: (ruleId: string, label: string) => void;
  onMoveRoute: (ruleId: string, offset: number) => void;
  onRemoveRoute: (ruleId: string) => void;
  onConditionChange: (ruleId: string, index: number, patch: ConditionPatch) => void;
}
