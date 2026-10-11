export const SAMPLE_AGENT_NAME = 'Support assistant';
export const SAMPLE_AGENT_DESCRIPTION = 'Greets customers and hands people over to the team.';
export const SAMPLE_AGENT_NOTE = 'First version';
export const SAMPLE_FIRST_PAGE_SIZE = 1;

export enum SampleNodeKey {
  Trigger = 'trigger',
  Route = 'route',
  Greeting = 'greeting',
  HandOff = 'hand_off',
}

export const SAMPLE_NODE_LABELS: Readonly<Record<SampleNodeKey, string>> = {
  [SampleNodeKey.Trigger]: 'Customer message',
  [SampleNodeKey.Route]: 'Wants a person?',
  [SampleNodeKey.Greeting]: 'Greeting',
  [SampleNodeKey.HandOff]: 'Hand off to the team',
};

export const SAMPLE_NODE_POSITIONS: Readonly<Record<SampleNodeKey, { x: number; y: number }>> = {
  [SampleNodeKey.Trigger]: { x: 0, y: 120 },
  [SampleNodeKey.Route]: { x: 280, y: 120 },
  [SampleNodeKey.Greeting]: { x: 560, y: 0 },
  [SampleNodeKey.HandOff]: { x: 560, y: 240 },
};

export const SAMPLE_RULE_LABEL = 'Asks for a person';
export const SAMPLE_MESSAGE_VARIABLE = 'message.text';
export const SAMPLE_HAND_OFF_PHRASE = 'human';
export const SAMPLE_GREETING_TEXT = 'Hello! How can we help you today?';
export const SAMPLE_HAND_OFF_CUSTOMER_MESSAGE = 'A person from the team will answer you soon.';
export const SAMPLE_HAND_OFF_REASON = 'The customer asked for a person.';
export const SAMPLE_HAND_OFF_FALLBACK_MESSAGE =
  'Sorry, nobody is free right now. We will write back soon.';
