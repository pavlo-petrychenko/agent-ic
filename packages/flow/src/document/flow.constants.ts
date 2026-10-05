export const FLOW_SCHEMA_VERSION = 1;

export enum NodeType {
  TriggerMessage = 'trigger_message',
  TriggerExternalEvent = 'trigger_external_event',
  TriggerSchedule = 'trigger_schedule',
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
];

export const FIXED_PORT_NAMES: readonly string[] = Object.values(PortName);
