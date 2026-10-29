export const FLOW_SCHEMA_VERSION = 3;

export enum NodeType {
  TriggerMessage = 'trigger_message',
  TriggerExternalEvent = 'trigger_external_event',
  TriggerSchedule = 'trigger_schedule',
  TriggerInactivity = 'trigger_inactivity',
  Agent = 'agent',
  Completion = 'completion',
  Router = 'router',
  Parallel = 'parallel',
  ApiRequest = 'api_request',
  SendMessage = 'send_message',
  Escalation = 'escalation',
}

export enum PortName {
  Next = 'next',
  Error = 'error',
  Else = 'else',
  Branches = 'branches',
}

export const TRIGGER_NODE_TYPES: readonly NodeType[] = [
  NodeType.TriggerMessage,
  NodeType.TriggerExternalEvent,
  NodeType.TriggerSchedule,
  NodeType.TriggerInactivity,
];

export const FIXED_PORT_NAMES: readonly string[] = Object.values(PortName);
