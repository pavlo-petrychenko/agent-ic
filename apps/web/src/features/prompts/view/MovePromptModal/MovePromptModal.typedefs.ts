import type { ReactNode } from 'react';

export interface MovePromptModalProps {
  readonly submitting: boolean;
  readonly submitDisabled: boolean;
  readonly error: string | null;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly children: ReactNode;
}
