export enum ActorKind {
  User = 'user',
  ApiChannel = 'api-channel',
  System = 'system',
  Anonymous = 'anonymous',
}

export enum SystemReason {
  Job = 'job',
  Schedule = 'schedule',
}

export const ACTOR_DISCRIMINATOR = 'kind';
