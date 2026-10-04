import { useStore } from '@tanstack/react-form';
import { useFormContext } from '@/shared/forms/contexts/form.context';
import type { SubmitButtonProps } from '@/shared/forms/fields/SubmitButton/SubmitButton.typedefs';
import { Button } from '@/shared/ui/Button';

export function SubmitButton({ children }: SubmitButtonProps) {
  const form = useFormContext();
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <Button type="submit" loading={submitting}>
      {children}
    </Button>
  );
}
