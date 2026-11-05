import { PromptVersionKind, parseVariablePath } from '@agent-ic/flow';
import type { PromptBindings as PromptBindingsMap } from '@agent-ic/flow';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { usePromptVersions } from '@/features/prompts/communication/hooks/usePromptVersions';
import {
  PROMPT_PIN_LATEST,
  PROMPT_VERSION_CHEVRON_SIZE,
  PROMPT_VERSION_RADIO_NAME,
} from '@/features/prompts/constants/promptField.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { PROMPT_PATH } from '@/features/prompts/constants/route.constants';
import { PromptBindings } from '@/features/prompts/containers/PromptLibraryCard/PromptBindings';
import type { PromptLibraryCardProps } from '@/features/prompts/containers/PromptLibraryCard/PromptLibraryCard.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { Radio } from '@/shared/ui/inputs/Radio';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

const NO_BINDINGS: PromptBindingsMap = {};

export function PromptLibraryCard({
  workspaceId,
  source,
  variables,
  autoFill = false,
  onAutoFilled = null,
  error,
  onChange,
  onChangePrompt,
}: PromptLibraryCardProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const navigate = useNavigate();
  const { prompts } = usePromptLibrary();
  const { versions, failed, retry } = usePromptVersions(source.promptRef);
  const prompt = prompts.find((item) => item.id === source.promptRef) ?? null;
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
  const promptName = prompt?.name ?? source.promptRef;
  const displayVersion = shownVersion?.number ?? pinned;
  const libraryLabel =
    displayVersion === null
      ? t('field.library')
      : t('field.libraryVersion', { number: displayVersion });
  const pinNumber = pinned ?? shownVersion?.number ?? null;
  const pinValue = pinned === null ? PROMPT_PIN_LATEST : String(pinned);
  const pinOptions = [
    ...(pinNumber === null
      ? []
      : [{ value: String(pinNumber), label: t('field.pinVersion', { number: pinNumber }) }]),
    { value: PROMPT_PIN_LATEST, label: t('field.followLatest') },
  ];

  useEffect(() => {
    if (!autoFill || shownVersion === null || autoFilled.current === autoKey) {
      return;
    }
    autoFilled.current = autoKey;
    const matched = shownVersion.variables.filter(
      (name) =>
        !Object.hasOwn(bindings, name) &&
        variables.some((item) => item.id === name && parseVariablePath(item.id) !== null),
    );
    if (matched.length > 0) {
      onChange({
        ...source,
        bindings: {
          ...bindings,
          ...Object.fromEntries(matched.map((name) => [name, name])),
        },
      });
    }
    onAutoFilled?.();
  }, [autoFill, autoKey, bindings, onChange, onAutoFilled, shownVersion, source, variables]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Button
        fullWidth
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Md}
        className="justify-between [&>span]:flex [&>span]:w-full [&>span]:items-center"
        aria-label={t('field.changeNamed', { name: promptName })}
        onClick={onChangePrompt}
      >
        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <span className="truncate">{promptName}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {libraryLabel}
            </Text>
            <Icon name={IconName.ChevronDown} size={PROMPT_VERSION_CHEVRON_SIZE} />
          </span>
        </span>
      </Button>
      <Button
        className="self-start"
        variant={ButtonVariant.Ghost}
        size={ButtonSize.Sm}
        onClick={() => {
          void navigate({
            to: PROMPT_PATH,
            params: { workspaceId, promptId: source.promptRef },
          });
        }}
      >
        {t('field.openInLibrary')}
      </Button>
      {pinNumber !== null && (
        <Radio
          name={`${PROMPT_VERSION_RADIO_NAME}-${source.promptRef}`}
          value={pinValue}
          onValueChange={(next) => {
            onChange({
              ...source,
              pin:
                next === PROMPT_PIN_LATEST
                  ? { kind: PromptVersionKind.Latest }
                  : { kind: PromptVersionKind.Pinned, number: Number(next) },
            });
          }}
          options={pinOptions}
          ariaLabel={t('field.version')}
        />
      )}
      {versions === null && (
        <Text kind={TextKind.Caption} color={failed ? TextColor.Err : TextColor.Mute}>
          {failed ? t('versions.loadError') : t('versions.loading')}
        </Text>
      )}
      {failed && (
        <Button
          className="self-start"
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          onClick={() => void retry()}
        >
          {t('retry')}
        </Button>
      )}
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
    </div>
  );
}
