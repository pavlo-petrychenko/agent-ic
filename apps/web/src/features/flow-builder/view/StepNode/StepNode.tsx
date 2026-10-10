import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import type { StepNodeProps } from '@/features/flow-builder/view/StepNode/StepNode.typedefs';
import { FlowNode } from '@/shared/ui/flow/FlowNode';
import { TriggerNode } from '@/shared/ui/flow/TriggerNode';

export function StepNode({ node, slots }: StepNodeProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const presentation = NODE_PRESENTATION[node.type];

  return node.hasInPort ? (
    <FlowNode
      kind={presentation.kind}
      icon={presentation.icon}
      overline={t(`step.${node.type}`)}
      name={node.label}
      selected={slots.selected}
      faded={slots.faded}
      inPort={slots.inPort}
      outPorts={node.outPorts.length > 0 ? slots.outPorts : null}
    />
  ) : (
    <TriggerNode
      title={node.label}
      subtitle={t(`step.${node.type}`)}
      icon={presentation.icon}
      selected={slots.selected}
      faded={slots.faded}
      outPort={slots.outPorts}
    />
  );
}
