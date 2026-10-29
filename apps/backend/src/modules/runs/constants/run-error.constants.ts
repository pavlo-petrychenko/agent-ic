export const RUN_NOT_FOUND_MESSAGE = 'The run was not found.';
export const UNSUPPORTED_NODE_TYPE_MESSAGE = 'No step executor handles this node type.';
export const RUN_FLOW_INVALID_MESSAGE = 'The flow has no message trigger or it loops.';
export const API_REQUEST_AUTH_UNSUPPORTED_MESSAGE =
  'API request auth is not supported yet; remove it from the step.';
export const API_REQUEST_FAILED_MESSAGE = 'The API request did not get a successful answer.';
export const STEP_PROMPT_UNAVAILABLE_MESSAGE =
  'The step has no inline prompt; prompt library references cannot run yet.';
export const STEP_MODEL_UNKNOWN_MESSAGE = 'The step model is not in the model catalog.';
export const NO_INACTIVITY_TRIGGER_MESSAGE = 'The flow has no inactivity trigger.';
export const INACTIVITY_ATTEMPTS_USED_MESSAGE =
  'Every inactivity follow-up of this silence is used.';
export const INACTIVITY_CONDITIONS_NOT_MET_MESSAGE =
  'The conversation does not meet the inactivity trigger conditions.';
export const CONVERSATION_BUSY_MESSAGE = 'A run is working on the conversation.';
export const SCHEDULE_TRIGGER_NOT_FOUND_MESSAGE = 'The flow has no schedule trigger with this id.';
export const SCHEDULE_NEEDS_CUSTOMER_MESSAGE_MESSAGE =
  'A schedule run needs one customer message in the conversation first.';
export const SCHEDULE_RUN_BUSY_MESSAGE = 'The conversation has a run in progress.';
