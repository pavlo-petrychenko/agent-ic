import type { ComponentProps, ReactNode } from 'react';
import type { StepperStep } from '@/shared/ui/navigation/Stepper';

export interface WizardFrameProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: string;
  subtitle?: string | null;
  steps: readonly StepperStep[];
  current: number;
  stepperLabel: string;
  stepCompletedLabel: string;
  exitLabel: string;
  onExit: () => void;
  side?: ReactNode | null;
  previewLabel: string;
  footerLeft?: ReactNode | null;
  footerRight?: ReactNode | null;
  children: ReactNode;
}
