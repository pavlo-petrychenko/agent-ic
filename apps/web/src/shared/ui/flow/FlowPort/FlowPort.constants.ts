export enum FlowPortDirection {
  In = 'in',
  Out = 'out',
}

export enum FlowPortState {
  Hidden = 'hidden',
  Idle = 'idle',
  Hover = 'hover',
  Source = 'source',
  Target = 'target',
}

export enum FlowPortStep {
  Next = 1,
  Previous = -1,
}

export enum FlowPortKey {
  Enter = 'Enter',
  Space = ' ',
  Escape = 'Escape',
  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
}

export const FLOW_PORT_CYCLE_STEPS: Readonly<Partial<Record<string, FlowPortStep>>> = {
  [FlowPortKey.ArrowDown]: FlowPortStep.Next,
  [FlowPortKey.ArrowRight]: FlowPortStep.Next,
  [FlowPortKey.ArrowUp]: FlowPortStep.Previous,
  [FlowPortKey.ArrowLeft]: FlowPortStep.Previous,
};
