import { MAX_AUTO_CLOSE_MINUTES, MIN_AUTO_CLOSE_MINUTES } from '@agent-ic/flow';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  MINUTES_PER_SILENCE_UNIT,
  SILENCE_UNITS,
  SilenceUnit,
} from '@/features/flow-builder/constants/flowSettings.constants';
import { InputType } from '@/features/flow-builder/constants/inspector.constants';
import type { SilenceFieldProps } from '@/features/flow-builder/view/FlowSettingsInspector/SilenceField/SilenceField.typedefs';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';

const toMinutes = (text: string, unit: SilenceUnit): number | null => {
  const minutes = Number(text) * MINUTES_PER_SILENCE_UNIT[unit];
  return text.trim() !== '' &&
    Number.isInteger(minutes) &&
    minutes >= MIN_AUTO_CLOSE_MINUTES &&
    minutes <= MAX_AUTO_CLOSE_MINUTES
    ? minutes
    : null;
};

export function SilenceField({ minutes, onChange }: SilenceFieldProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const [unit, setUnit] = useState(() =>
    minutes % MINUTES_PER_SILENCE_UNIT[SilenceUnit.Days] === 0
      ? SilenceUnit.Days
      : SilenceUnit.Hours,
  );
  const [typed, setTyped] = useState<string | null>(null);
  const text = typed ?? String(minutes / MINUTES_PER_SILENCE_UNIT[unit]);
  const valid = toMinutes(text, unit) !== null;

  const update = (nextText: string, nextUnit: SilenceUnit) => {
    const next = toMinutes(nextText, nextUnit);
    if (next === null) {
      setTyped(nextText);
    } else {
      setTyped(null);
      onChange(next);
    }
  };

  return (
    <Field
      label={t('settings.autoClose.length')}
      error={valid ? null : t('settings.autoClose.invalid')}
    >
      {(control) => (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <Input
            {...control}
            type={InputType.Number}
            inputMode="numeric"
            value={text}
            onChange={(event) => update(event.target.value, unit)}
          />
          <Select
            aria-label={t('settings.autoClose.unit')}
            value={unit}
            options={SILENCE_UNITS.map((value) => ({
              value,
              label: t(`settings.autoClose.units.${value}`),
            }))}
            onChange={(event) => {
              const next = SILENCE_UNITS.find((value) => value === event.target.value) ?? unit;
              setUnit(next);
              update(text, next);
            }}
          />
        </div>
      )}
    </Field>
  );
}
