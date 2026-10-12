import type { ReactNode } from 'react';

export interface ProfileDetailsCardProps {
  readonly saving: boolean;
  readonly onSave: () => void;
  readonly children: ReactNode;
}
