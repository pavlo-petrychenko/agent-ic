import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '@/shared/forms/contexts/form.context';
import type { TextareaFieldProps } from '@/shared/forms/fields/TextareaField/TextareaField.typedefs';
import { firstErrorMessage } from '@/shared/forms/helpers/fieldError.helpers';
import { Field } from '@/shared/ui/inputs/Field';
import { Textarea } from '@/shared/ui/inputs/Textarea';

export function TextareaField({
  label,
  hint = null,
  error: serverError = null,
  ...textareaProps
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const meta = useStore(field.store, (state) => state.meta);
  const value = useStore(field.store, (state) => state.value);
  const error = serverError ?? (meta.isTouched ? firstErrorMessage(meta.errors) : null);

  return (
    <Field label={label} hint={hint} error={error}>
      {(control) => (
        <Textarea
          {...textareaProps}
          id={control.id}
          aria-describedby={control['aria-describedby']}
          invalid={control.invalid}
          name={field.name}
          value={value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
        />
      )}
    </Field>
  );
}
