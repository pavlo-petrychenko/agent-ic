import { useStore } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { useFieldContext } from '@/shared/forms/contexts/form.context';
import type { PasswordFieldProps } from '@/shared/forms/fields/PasswordField/PasswordField.typedefs';
import { firstErrorMessage } from '@/shared/forms/helpers/fieldError.helpers';
import { Field } from '@/shared/ui/Field';
import { PasswordInput } from '@/shared/ui/PasswordInput';

export function PasswordField({
  label,
  hint = null,
  error: serverError = null,
  ...inputProps
}: PasswordFieldProps) {
  const { t } = useTranslation();
  const field = useFieldContext<string>();
  const meta = useStore(field.store, (state) => state.meta);
  const value = useStore(field.store, (state) => state.value);
  const error = serverError ?? (meta.isTouched ? firstErrorMessage(meta.errors) : null);

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
