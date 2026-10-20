import { PromptVersionKind } from '@agent-ic/flow';
import type { PromptBindings as PromptBindingsMap } from '@agent-ic/flow';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { usePromptVersions } from '@/features/prompts/communication/hooks/usePromptVersions';
import { PROMPT_PIN_LATEST } from '@/features/prompts/constants/promptField.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { PROMPT_PATH } from '@/features/prompts/constants/route.constants';
import { PromptBindings } from '@/features/prompts/containers/PromptLibraryCard/PromptBindings';
import type { PromptLibraryCardProps } from '@/features/prompts/containers/PromptLibraryCard/PromptLibraryCard.typedefs';
import { findFolderName } from '@/features/prompts/logic/helpers/promptFolder.helpers';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card, CardGap } from '@/shared/ui/display/Card';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Field } from '@/shared/ui/inputs/Field';
import { Select } from '@/shared/ui/inputs/Select';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

const NO_BINDINGS: PromptBindingsMap = {};

export function PromptLibraryCard({
  workspaceId,
  source,
  variables,
  error,
  onChange,
}: PromptLibraryCardProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const navigate = useNavigate();
  const { folders, prompts } = usePromptLibrary();
  const { versions } = usePromptVersions(source.promptRef);
  const prompt = prompts.find((item) => item.id === source.promptRef) ?? null;
  const folderName = prompt === null ? null : findFolderName(folders, prompt.folderId);
  const pinned = source.pin.kind === PromptVersionKind.Pinned ? source.pin.number : null;
  const shownVersion =
    versions === null
      ? null
      : pinned === null
        ? (versions[0] ?? null)
        : (versions.find((version) => version.number === pinned) ?? null);
  const bindings = source.bindings ?? NO_BINDINGS;
  const autoFilled = useRef<string | null>(null);
  const autoKey = `${source.promptRef}:${shownVersion?.number ?? 'none'}`;

  useEffect(() => {
    if (shownVersion === null || autoFilled.current === autoKey) {
      return;
    }
    autoFilled.current = autoKey;
    const matched = shownVersion.variables.filter(
      (name) => !Object.hasOwn(bindings, name) && variables.some((item) => item.id === name),
    );
    if (matched.length === 0) {
      return;
    }
    onChange({
      ...source,
      bindings: {
        ...bindings,
        ...Object.fromEntries(matched.map((name) => [name, name])),
      },
    });
  }, [autoKey, bindings, onChange, shownVersion, source, variables]);

  const numbers = versions?.map((version) => version.number) ?? [];
  const options = [
    { value: PROMPT_PIN_LATEST, label: t('field.followLatest') },
    ...numbers.map((number) => ({
      value: String(number),
      label: t('versions.number', { number }),
    })),
    ...(pinned !== null && !numbers.includes(pinned)
      ? [{ value: String(pinned), label: t('versions.number', { number: pinned }) }]
      : []),
  ];

  return (
    <Card gap={CardGap.Sm} className="min-w-0">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="flex min-w-0 flex-col gap-1">
          <Text kind={TextKind.BodySmall}>{prompt?.name ?? source.promptRef}</Text>
          {folderName !== null && (
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {folderName}
            </Text>
          )}
        </span>
        <Button
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          icon={IconName.Compl}
          onClick={() => {
            void navigate({
              to: PROMPT_PATH,
              params: { workspaceId, promptId: source.promptRef },
            });
          }}
        >
          {t('field.openInLibrary')}
        </Button>
      </div>
      <Field label={t('field.version')}>
        {(control) => (
          <Select
            {...control}
            value={pinned === null ? PROMPT_PIN_LATEST : String(pinned)}
            options={options}
            onChange={(event) =>
              onChange({
                ...source,
                pin:
                  event.target.value === PROMPT_PIN_LATEST
                    ? { kind: PromptVersionKind.Latest }
                    : { kind: PromptVersionKind.Pinned, number: Number(event.target.value) },
              })
            }
          />
        )}
      </Field>
      <PromptBindings
        paths={shownVersion?.variables ?? []}
        options={variables}
        bindings={bindings}
        onChange={(next) => onChange({ ...source, bindings: next })}
      />
      {error !== null && (
        <Text kind={TextKind.Caption} color={TextColor.Err}>
          {error}
        </Text>
      )}
    </Card>
  );
}
