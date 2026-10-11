import { AGENT_AWAY_MESSAGE_MAX_LENGTH } from '@agent-ic/contracts';
import { AwayMessageIssue } from '@/features/agents/constants/agentPause.constants';

export const validateAwayMessage = (text: string): AwayMessageIssue | null => {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return AwayMessageIssue.Required;
  }
  return trimmed.length > AGENT_AWAY_MESSAGE_MAX_LENGTH ? AwayMessageIssue.TooLong : null;
};
