export enum OutputFieldType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Enum = 'enum',
  StringList = 'string_list',
}

export const AGENT_MESSAGES_FIELD_NAME = 'messages';

export const AGENT_OUTCOME_FIELD_NAME = 'outcome';

export const AGENT_OUTCOME_REASON_FIELD_NAME = 'outcome_reason';

export const AGENT_OUTCOME_CONTINUE = 'continue';

export const AGENT_OUTCOME_FIELD_NAMES: readonly string[] = [
  AGENT_OUTCOME_FIELD_NAME,
  AGENT_OUTCOME_REASON_FIELD_NAME,
];
