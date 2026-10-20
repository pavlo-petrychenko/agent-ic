import type { ReactNode } from 'react';

export interface SavePromptVersionModalProps {
  readonly promptName: string;
  readonly versionNumber: number;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly children?: ReactNode;
}
