import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptBindingsProps } from '@/features/prompts/containers/PromptLibraryCard/PromptBindings/PromptBindings.typedefs';
import { Combobox } from '@/shared/ui/inputs/Combobox';
import { VariableChip } from '@/shared/ui/inputs/VariableChip';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

const EMPTY_VALUE = '';

export function PromptBindings({ paths, options, bindings, onChange }: PromptBindingsProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const available = useMemo(() => new Set(options.map((option) => option.id)), [options]);

  if (paths.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-col gap-1">
        <Text kind={TextKind.Caption}>{t('field.variables.title')}</Text>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('field.variables.note')}
        </Text>
      </div>
      {paths.map((path) => {
        const value = bindings[path] ?? EMPTY_VALUE;
        const unknown = value !== EMPTY_VALUE && !available.has(value);
        const error =
          value === EMPTY_VALUE
            ? t('field.variables.unmapped')
            : unknown
              ? t('field.variables.unknown')
              : null;
        const rows = unknown ? [...options, { id: value, label: value }] : options;

        return (
          <div key={path} className="flex min-w-0 items-start gap-2">
            <VariableChip className="shrink-0" path={path} />
            <div className="min-w-0 flex-1">
              <Combobox
                aria-label={t('field.variables.mapLabel', { variable: path })}
                value={value}
                options={rows.map((option) => ({
                  value: option.id,
                  label:
                    option.group === undefined ? option.label : `${option.label} · ${option.group}`,
                }))}
                onChange={(next) => {
                  const nextBindings = { ...bindings };
                  if (next === EMPTY_VALUE) {
                    delete nextBindings[path];
                  } else {
                    nextBindings[path] = next;
                  }
                  onChange(nextBindings);
                }}
                searchLabel={t('field.variables.search')}
                searchClearLabel={t('field.variables.searchClear')}
                emptyLabel={t('field.variables.empty')}
                placeholder={t('field.variables.choose')}
                invalid={error !== null}
                error={error}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
