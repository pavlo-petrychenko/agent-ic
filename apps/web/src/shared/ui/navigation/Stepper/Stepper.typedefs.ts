import type { ComponentProps } from 'react';

export interface StepperStep {
  id: string;
  label: string;
}

export interface StepperProps extends Omit<ComponentProps<'ol'>, 'children' | 'aria-label'> {
  steps: readonly StepperStep[];
  current: number;
  ariaLabel: string;
  completedLabel: string;
}
