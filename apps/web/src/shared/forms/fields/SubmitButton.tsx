import { useStore } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { useFormContext } from '@/shared/forms/formContext';
import { Button } from '@/shared/ui/Button';

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
