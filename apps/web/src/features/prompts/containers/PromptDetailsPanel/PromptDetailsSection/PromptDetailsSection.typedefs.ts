import type { ReactNode } from 'react';

export interface PromptDetailsSectionProps {
  readonly title: string;
  readonly action: ReactNode;
  readonly children: ReactNode;
}
