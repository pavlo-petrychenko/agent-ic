import type { ReactNode } from 'react';

export interface NewPromptModalProps {
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly children: ReactNode;
}
