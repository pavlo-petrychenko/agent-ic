import { useStore } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { useFieldContext } from '@/shared/forms/formContext';
import { firstErrorMessage } from '@/shared/forms/forms.helpers';
import { Field } from '@/shared/ui/Field';
import type { InputProps } from '@/shared/ui/Input';
import { PasswordInput } from '@/shared/ui/PasswordInput';

interface PasswordFieldProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'onBlur' | 'id' | 'name' | 'type'
> {
  label: string;
  hint?: string | null;
}

export function PasswordField({ label, hint = null, ...inputProps }: PasswordFieldProps) {
  const { t } = useTranslation();
  const field = useFieldContext<string>();
  const meta = useStore(field.store, (state) => state.meta);
  const value = useStore(field.store, (state) => state.value);
  const error = meta.isTouched ? firstErrorMessage(meta.errors) : null;

  return (
    <Field label={label} hint={hint} error={error}>
      {(control) => (
        <PasswordInput
          {...inputProps}
          id={control.id}
          aria-describedby={control['aria-describedby']}
          invalid={control.invalid}
          name={field.name}
          value={value}
          showLabel={t('ui.showPassword')}
          hideLabel={t('ui.hidePassword')}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
        />
      )}
    </Field>
  );
}
