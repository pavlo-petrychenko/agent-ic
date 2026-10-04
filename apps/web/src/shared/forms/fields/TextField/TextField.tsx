import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '@/shared/forms/contexts/form.context';
import type { TextFieldProps } from '@/shared/forms/fields/TextField/TextField.typedefs';
import { firstErrorMessage } from '@/shared/forms/helpers/fieldError.helpers';
import { Field } from '@/shared/ui/Field';
import { Input } from '@/shared/ui/Input';

export function TextField({ label, hint = null, ...inputProps }: TextFieldProps) {
  const field = useFieldContext<string>();
  const meta = useStore(field.store, (state) => state.meta);
  const value = useStore(field.store, (state) => state.value);
  const error = meta.isTouched ? firstErrorMessage(meta.errors) : null;

  return (
    <Field label={label} hint={hint} error={error}>
      {(control) => (
        <Input
          {...inputProps}
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
