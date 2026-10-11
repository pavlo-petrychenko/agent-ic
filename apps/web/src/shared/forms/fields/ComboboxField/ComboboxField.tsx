import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '@/shared/forms/contexts/form.context';
import type { ComboboxFieldProps } from '@/shared/forms/fields/ComboboxField/ComboboxField.typedefs';
import { firstErrorMessage } from '@/shared/forms/helpers/fieldError.helpers';
import { Combobox } from '@/shared/ui/inputs/Combobox';
import { Field } from '@/shared/ui/inputs/Field';

export function ComboboxField({
  label,
  hint = null,
  error: serverError = null,
  ...comboboxProps
}: ComboboxFieldProps) {
  const field = useFieldContext<string>();
  const meta = useStore(field.store, (state) => state.meta);
  const value = useStore(field.store, (state) => state.value);
  const error = serverError ?? (meta.isTouched ? firstErrorMessage(meta.errors) : null);

  return (
    <Field label={label} hint={hint} error={error}>
      {(control) => (
        <Combobox
          {...comboboxProps}
          id={control.id}
          aria-describedby={control['aria-describedby']}
          invalid={control.invalid}
          value={value}
          onChange={field.handleChange}
        />
      )}
    </Field>
  );
}
