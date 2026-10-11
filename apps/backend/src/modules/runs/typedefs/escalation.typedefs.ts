import type { EscalationMode, EscalationNode } from '@agent-ic/flow';

export type EscalationRecipients = Extract<
  EscalationNode['config'],
  { readonly mode: EscalationMode.Escalate }
>['notify']['recipients'];
