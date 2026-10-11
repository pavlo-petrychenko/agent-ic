import type { AgentDetails } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export const normalizeAgentDetails = ({ name, description }: AgentDetails): AgentDetails => {
  const text = description?.trim() ?? '';
  return { name: name.trim(), description: text === '' ? null : text };
};

export const sameAgentDetails = (left: AgentDetails, right: AgentDetails): boolean =>
  left.name === right.name && left.description === right.description;
