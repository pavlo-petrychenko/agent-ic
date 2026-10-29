import {
  AGENT_MESSAGES_FIELD_NAME,
  AGENT_OUTCOME_CONTINUE,
  AGENT_OUTCOME_FIELD_NAME,
  AGENT_OUTCOME_REASON_FIELD_NAME,
  AgentExitKind,
} from '@agent-ic/flow';

export const AGENT_EXITS_SECTION_SEPARATOR = '\n\n';
export const AGENT_EXITS_LINE_SEPARATOR = '\n';

export const AGENT_EXITS_CONTRACT: readonly string[] = [
  '## Conversation exits',
  `Every answer sets \`${AGENT_OUTCOME_FIELD_NAME}\` and \`${AGENT_OUTCOME_REASON_FIELD_NAME}\` next to \`${AGENT_MESSAGES_FIELD_NAME}\`.`,
  `- Set \`${AGENT_OUTCOME_FIELD_NAME}\` to \`${AGENT_OUTCOME_CONTINUE}\` while the conversation goes on as usual.`,
  `- Set it to one of the exits below only when its criterion is met. Then \`${AGENT_MESSAGES_FIELD_NAME}\` is the last thing the customer reads from you: a goodbye, or a line saying that a person takes over.`,
  '- Never promise when a person will reply.',
  `- \`${AGENT_OUTCOME_REASON_FIELD_NAME}\` says in one short sentence why you chose the outcome.`,
];

export const AGENT_EXIT_CRITERION_LEAD: Readonly<Record<AgentExitKind, string>> = {
  [AgentExitKind.End]: `Set \`${AGENT_OUTCOME_FIELD_NAME}\` to \`${AgentExitKind.End}\` to end the conversation when:`,
  [AgentExitKind.Handoff]: `Set \`${AGENT_OUTCOME_FIELD_NAME}\` to \`${AgentExitKind.Handoff}\` to hand the conversation to a person when:`,
};
