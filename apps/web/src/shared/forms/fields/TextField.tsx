import { useStore } from '@tanstack/react-form';

import { Field } from '@/shared/ui/Field';
import { Input, type InputProps } from '@/shared/ui/Input';

import { useFieldContext } from '../formContext';
import { firstErrorMessage } from '../forms.helpers';

interface TextFieldProps extends Omit<InputProps, 'value' | 'onChange' | 'onBlur' | 'id' | 'name'> {
  label: string;
  hint?: string | null;
}

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
