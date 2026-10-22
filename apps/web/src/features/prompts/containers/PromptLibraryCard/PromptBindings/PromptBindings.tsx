import { parseVariablePath } from '@agent-ic/flow';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptBindingsProps } from '@/features/prompts/containers/PromptLibraryCard/PromptBindings/PromptBindings.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Combobox } from '@/shared/ui/inputs/Combobox';
import { VariableChip } from '@/shared/ui/inputs/VariableChip';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

const EMPTY_VALUE = '';
const GROUP_SEPARATOR = ' · ';

export function PromptBindings({ paths, options, bindings, onChange }: PromptBindingsProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const usable = useMemo(
    () => options.filter((option) => parseVariablePath(option.id) !== null),
    [options],
  );
  const available = useMemo(() => new Set(usable.map((option) => option.id)), [usable]);
  const matched = paths.filter((path) => !Object.hasOwn(bindings, path) && available.has(path));

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
        const stored = Object.hasOwn(bindings, path) ? bindings[path] : undefined;
        const value = stored ?? EMPTY_VALUE;
        const known =
          parseVariablePath(value) !== null &&
          usable.some(
            (option) =>
              option.id === value ||
              (option.open === true &&
                (value.startsWith(`${option.id}.`) || value.startsWith(`${option.id}[`))),
          );
        const unknown = value !== EMPTY_VALUE && !known;
        const error =
          value === EMPTY_VALUE
            ? t('field.variables.unmapped')
            : unknown
              ? t('field.variables.unknown')
              : null;
        const rows: readonly { id: string; label: string; group?: string }[] = unknown
          ? [...usable, { id: value, label: value }]
          : usable;

        return (
          <div key={path} className="flex min-w-0 items-start gap-2">
            <VariableChip className="shrink-0" path={path} />
            <div className="min-w-0 flex-1">
              <Combobox
                aria-label={t('field.variables.mapLabel', { variable: path })}
                value={value}
                options={[
                  { value: EMPTY_VALUE, label: t('field.variables.none') },
                  ...rows.map((option) => ({
                    value: option.id,
                    label:
                      option.group === undefined
                        ? option.label
                        : `${option.label}${GROUP_SEPARATOR}${option.group}`,
                  })),
                ]}
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
      {matched.length > 0 && (
        <Button
          className="self-start"
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          onClick={() =>
            onChange({
              ...bindings,
              ...Object.fromEntries(matched.map((path) => [path, path])),
            })
          }
        >
          {t('field.variables.useMatches')}
        </Button>
      )}
    </div>
  );
}
