import { AGENT_EXIT_KINDS, AGENT_OUTCOME_FIELD_NAME, PortName, enabledExits } from '@agent-ic/flow';
import type { AgentNode } from '@agent-ic/flow';
import {
  AGENT_EXIT_CRITERION_LEAD,
  AGENT_EXITS_CONTRACT,
  AGENT_EXITS_LINE_SEPARATOR,
  AGENT_EXITS_SECTION_SEPARATOR,
} from '@/modules/runs/constants/agent-exit.constants';
import { renderStepText } from '@/modules/runs/helpers/outbound-message.helpers';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';

export const agentExitsPrompt = (node: AgentNode, variables: StepData): string | null => {
  const criteria = AGENT_EXIT_KINDS.flatMap((kind) => {
    const exit = node.config.exits[kind];
    return exit === null
      ? []
      : [
          [AGENT_EXIT_CRITERION_LEAD[kind], renderStepText(exit.when, variables)].join(
            AGENT_EXITS_LINE_SEPARATOR,
          ),
        ];
  });
  if (criteria.length === 0) {
    return null;
  }
  return [AGENT_EXITS_CONTRACT.join(AGENT_EXITS_LINE_SEPARATOR), ...criteria].join(
    AGENT_EXITS_SECTION_SEPARATOR,
  );
};

export const withAgentExits = (system: string, node: AgentNode, variables: StepData): string => {
  const exits = agentExitsPrompt(node, variables);
  return exits === null ? system : [system, exits].join(AGENT_EXITS_SECTION_SEPARATOR);
};

export const agentExitPort = (node: AgentNode, output: StepData): string => {
  const outcome = output[AGENT_OUTCOME_FIELD_NAME];
  return enabledExits(node).find((kind) => kind === outcome) ?? PortName.Next;
};
