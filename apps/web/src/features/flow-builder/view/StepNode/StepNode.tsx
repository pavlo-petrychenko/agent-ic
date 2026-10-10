import { useTranslation } from 'react-i18next';
import { Density } from '@/features/flow-builder/constants/density.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import { SUMMARY_SEPARATOR } from '@/features/flow-builder/constants/nodeSummary.constants';
import type { StepNodeProps } from '@/features/flow-builder/view/StepNode/StepNode.typedefs';
import { CompactNode, CompactNodeShape } from '@/shared/ui/flow/CompactNode';
import { FlowNode } from '@/shared/ui/flow/FlowNode';
import { TriggerNode } from '@/shared/ui/flow/TriggerNode';

export function StepNode({ node, slots, density }: StepNodeProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const presentation = NODE_PRESENTATION[node.type];
  const outPorts = node.outPorts.length > 0 ? slots.outPorts : null;
  const summary = node.summary
    .map((part) => t(`summary.${part.key}`, { ...part.params }))
    .join(SUMMARY_SEPARATOR);
  const { blocking } = node;

  if (density === Density.Compact) {
    return (
      <CompactNode
        label={node.label}
        kind={presentation.kind}
        icon={presentation.icon}
        shape={node.hasInPort ? CompactNodeShape.Pill : CompactNodeShape.Card}
        selected={slots.selected}
        faded={slots.faded}
        inPort={slots.inPort}
        outPorts={outPorts}
      />
    );
  }

  return node.hasInPort ? (
    <FlowNode
      kind={presentation.kind}
      icon={presentation.icon}
      overline={t(`step.${node.type}`)}
      name={node.label}
      meta={summary === '' ? null : summary}
      invalidLabel={blocking === null ? null : t(`issue.${blocking.code}`, { ...blocking.params })}
      selected={slots.selected}
      faded={slots.faded}
      inPort={slots.inPort}
      outPorts={outPorts}
    />
  ) : (
    <TriggerNode
      title={node.label}
      subtitle={summary === '' ? t(`step.${node.type}`) : summary}
      icon={presentation.icon}
      selected={slots.selected}
      faded={slots.faded}
      outPort={slots.outPorts}
    />
  );
}
