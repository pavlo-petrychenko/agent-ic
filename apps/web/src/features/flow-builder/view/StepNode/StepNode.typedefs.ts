import type { CanvasNodeModel } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';
import type { FlowCanvasNodeSlots } from '@/shared/ui/flow/FlowCanvas';

export interface StepNodeProps {
  node: CanvasNodeModel;
  slots: FlowCanvasNodeSlots;
}
