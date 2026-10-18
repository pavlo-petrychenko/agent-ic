import { EVENT_ROOT, TODAY_VARIABLE } from '@agent-ic/flow';

export enum PromptVariableGroup {
  Message = 'message',
  User = 'user',
  Language = 'language',
  Conversation = 'conversation',
  System = 'system',
  Event = 'event',
  Caller = 'caller',
  Step = 'step',
}

export const PROMPT_VARIABLE_GROUP_BY_PATH: Readonly<Record<string, PromptVariableGroup>> = {
  'user.name': PromptVariableGroup.User,
  'user.language': PromptVariableGroup.Language,
};

export const PROMPT_VARIABLE_GROUP_BY_ROOT: Readonly<Record<string, PromptVariableGroup>> = {
  message: PromptVariableGroup.Message,
  user: PromptVariableGroup.User,
  channel: PromptVariableGroup.Conversation,
  history: PromptVariableGroup.Conversation,
  conversation: PromptVariableGroup.Conversation,
  [TODAY_VARIABLE]: PromptVariableGroup.System,
  [EVENT_ROOT]: PromptVariableGroup.Event,
  user_id: PromptVariableGroup.Caller,
};

export const PROMPT_VARIABLE_DEFAULT_GROUP = PromptVariableGroup.Step;
