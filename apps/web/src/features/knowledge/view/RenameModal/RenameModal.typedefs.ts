import type { ReactNode } from 'react';

export interface RenameModalProps {
  readonly title: string;
  readonly description: string | null;
  readonly submitLabel: string;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly children: ReactNode;
}
