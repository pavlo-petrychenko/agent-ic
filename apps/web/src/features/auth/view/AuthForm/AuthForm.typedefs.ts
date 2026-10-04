import type { ReactNode } from 'react';

export interface AuthFormProps {
  onSubmit: () => void;
  children: ReactNode;
}
