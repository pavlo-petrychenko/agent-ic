import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DURATION_INPUT_MIN } from '@/shared/forms/constants/duration.constants';
import type { DurationUnit } from '@/shared/forms/constants/duration.constants';
import type { DurationFieldProps } from '@/shared/forms/fields/DurationField/DurationField.typedefs';
import { durationParts, toBaseUnits, unitsFrom } from '@/shared/forms/helpers/duration.helpers';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';

export function DurationField({
  label,
  value,
  base,
  onChange,
  units = null,
  hint = null,
  error = null,
  disabled = false,
}: DurationFieldProps) {
  const { t } = useTranslation();
  const offered = units ?? unitsFrom(base);
  const [preferred, setPreferred] = useState<DurationUnit | null>(null);
  const parts = durationParts(value, base, preferred, offered);

  const commit = (raw: string, unit: DurationUnit) => {
    const amount = Number(raw);
    if (Number.isInteger(amount) && amount >= DURATION_INPUT_MIN) {
      const next = toBaseUnits(amount, unit, base);
      if (next !== value) {
        onChange(next);
      }
    }
  };

  return (
    <Field label={label} hint={hint} error={error}>
      {(control) => (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <Input
            key={`${parts.unit}:${parts.amount}`}
            id={control.id}
            aria-describedby={control['aria-describedby']}
            invalid={control.invalid}
            disabled={disabled}
            type="number"
            inputMode="numeric"
            min={DURATION_INPUT_MIN}
            step={1}
            defaultValue={parts.amount}
            onBlur={(event) => commit(event.target.value, parts.unit)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
          <Select
            aria-label={t('ui.duration.unit')}
            disabled={disabled}
            value={parts.unit}
            options={offered.map((unit) => ({
              value: unit,
              label: t(`ui.duration.units.${unit}`),
            }))}
            onChange={(event) => {
              const unit = offered.find((candidate) => candidate === event.target.value);
              if (unit !== undefined) {
                setPreferred(unit);
                commit(String(parts.amount), unit);
              }
            }}
          />
        </div>
      )}
    </Field>
  );
}
