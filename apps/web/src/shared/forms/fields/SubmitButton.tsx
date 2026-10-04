import { useStore } from '@tanstack/react-form';
import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/Button';

import { useFormContext } from '../formContext';

interface SubmitButtonProps {
  children: ReactNode;
}

export function SubmitButton({ children }: SubmitButtonProps) {
  const form = useFormContext();
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <Button type="submit" loading={submitting}>
      {children}
    </Button>
  );
}
