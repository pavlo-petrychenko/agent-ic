import { useStore } from '@tanstack/react-form';
import { useFormContext } from '@/shared/forms/contexts/form.context';
import type { SubmitButtonProps } from '@/shared/forms/fields/SubmitButton/SubmitButton.typedefs';
import { Button, ButtonSize } from '@/shared/ui/Button';

export function SubmitButton({
  size = ButtonSize.Md,
  fullWidth = false,
  children,
}: SubmitButtonProps) {
  const form = useFormContext();
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <Button type="submit" loading={submitting} size={size} fullWidth={fullWidth}>
      {children}
    </Button>
  );
}
