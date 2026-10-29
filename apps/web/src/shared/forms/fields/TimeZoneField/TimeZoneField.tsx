import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TimeZoneFieldProps } from '@/shared/forms/fields/TimeZoneField/TimeZoneField.typedefs';
import { timeZoneOptions } from '@/shared/forms/helpers/timeZone.helpers';
import { Combobox } from '@/shared/ui/inputs/Combobox';
import { Field } from '@/shared/ui/inputs/Field';

export function TimeZoneField({
  label,
  value,
  onChange,
  hint = null,
  error = null,
  disabled = false,
  required = false,
  onBlur,
}: TimeZoneFieldProps) {
  const { t } = useTranslation();
  const options = useMemo(() => timeZoneOptions(value), [value]);
  const searchPlaceholder = t('ui.timeZone.searchPlaceholder');

  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(control) => (
        <Combobox
          id={control.id}
          aria-describedby={control['aria-describedby']}
          invalid={control.invalid}
          disabled={disabled}
          onBlur={onBlur}
          value={value}
          onChange={onChange}
          options={options}
          placeholder={searchPlaceholder}
          searchLabel={searchPlaceholder}
          searchClearLabel={t('ui.timeZone.searchClear')}
          emptyLabel={t('ui.timeZone.empty')}
        />
      )}
    </Field>
  );
}
