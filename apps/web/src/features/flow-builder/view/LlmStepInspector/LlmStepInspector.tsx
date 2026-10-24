import { MAX_RETRIES, NodeType, OutputFieldType } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  LIST_VALUE_JOINER,
  LIST_VALUE_SEPARATOR,
} from '@/features/flow-builder/constants/inspector.constants';
import {
  CONVERSATION_ROW_ID,
  PLATFORM_CHOICE_SOURCE,
  UNSET_OPTION,
} from '@/features/flow-builder/constants/llmStep.constants';
import type { ModelOption } from '@/features/flow-builder/typedefs/llmStep.typedefs';
import type { LlmStepInspectorProps } from '@/features/flow-builder/view/LlmStepInspector/LlmStepInspector.typedefs';
import { OutputFieldRow } from '@/features/flow-builder/view/LlmStepInspector/OutputFieldRow';
import { PromptField } from '@/features/prompts';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { RowList } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Combobox } from '@/shared/ui/inputs/Combobox';
import { Field } from '@/shared/ui/inputs/Field';
import { Select } from '@/shared/ui/inputs/Select';
import { Switch } from '@/shared/ui/inputs/Switch';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function LlmStepInspector({
  workspaceId,
  step,
  extra,
  onPromptChange,
  onPromptCommit,
  onModelChange,
  onModelType,
  onReasoningChange,
  onAddField,
  onFieldChange,
  onRemoveField,
}: LlmStepInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const message = (issue: FlowIssue | null) =>
    issue === null ? null : t(`issue.${issue.code}`, { ...issue.params });
  const chosen = step.options.find((option) => option.key === step.modelKey)?.choice ?? null;
  const platform = step.groups.find((group) => group.id === PLATFORM_CHOICE_SOURCE) ?? null;
  const keyGroups = step.groups.filter((group) => group.id !== PLATFORM_CHOICE_SOURCE);
  const optionLabel = ({ choice, model }: ModelOption) =>
    choice === null ||
    choice.vendor === null ||
    choice.inputPrice === null ||
    choice.outputPrice === null
      ? model
      : t('inspector.llm.modelOption', {
          label: choice.label,
          vendor: t(`inspector.llm.vendor.${choice.vendor}`),
          input: choice.inputPrice,
          output: choice.outputPrice,
        });
  const modelOptions = step.options.map((option) => ({
    value: option.key,
    label: optionLabel(option),
    ...(option.group === null ? {} : { group: option.group }),
  }));
  const modelGroups = step.groups.map((group) => ({
    id: group.id,
    label: group.label,
    hint: group.loading
      ? t('inspector.llm.keyModelsLoading')
      : group.failed
        ? t(group === platform ? 'inspector.llm.modelsFailed' : 'inspector.llm.keyModelsFailed')
        : null,
    action: group.failed ? { label: t('retry'), onSelect: group.retry } : null,
    creatable: group !== platform,
  }));
  const defaultLevel = chosen?.defaultReasoningLevel ?? null;

  useEffect(() => onPromptCommit, [onPromptCommit]);

  return (
    <>
      <InspectorSection title={t('inspector.llm.prompt')}>
        <div className="contents" onBlur={onPromptCommit}>
          <PromptField
            workspaceId={workspaceId}
            source={step.source}
            variables={step.variables}
            error={message(step.promptIssue)}
            onChange={onPromptChange}
          />
        </div>
      </InspectorSection>
      <InspectorSection
        title={t('inspector.llm.model')}
        note={
          step.keyName === null
            ? t('inspector.llm.platform')
            : t('inspector.llm.sourceKey', { name: step.keyName })
        }
      >
        <Combobox
          aria-label={t('inspector.llm.model')}
          value={step.modelKey ?? UNSET_OPTION}
          options={modelOptions}
          groups={modelGroups}
          placeholder={t('inspector.llm.pickModel')}
          searchLabel={t('inspector.llm.searchModels')}
          searchClearLabel={t('inspector.llm.clearModelSearch')}
          emptyLabel={t('inspector.llm.noModels')}
          createLabel={
            keyGroups.length === 0 ? null : (query) => t('inspector.llm.useTyped', { query })
          }
          onCreate={onModelType}
          error={message(step.modelIssue)}
          onChange={onModelChange}
        />
        {platform !== null && platform.failed && (
          <Callout
            tone={CalloutTone.Err}
            action={
              <Button variant={ButtonVariant.Ghost} size={ButtonSize.Sm} onClick={platform.retry}>
                {t('retry')}
              </Button>
            }
          >
            {t('inspector.llm.modelsFailed')}
          </Callout>
        )}
        {chosen !== null && chosen.reasoningLevels.length > 0 && (
          <Field label={t('inspector.llm.reasoning')}>
            {(control) => (
              <Select
                {...control}
                value={step.reasoning ?? UNSET_OPTION}
                options={[
                  {
                    value: UNSET_OPTION,
                    label:
                      defaultLevel === null
                        ? t('inspector.llm.reasoningDefault')
                        : t('inspector.llm.reasoningDefaultLevel', {
                            level: t(`inspector.llm.level.${defaultLevel}`),
                          }),
                  },
                  ...chosen.reasoningLevels.map((level) => ({
                    value: level,
                    label: t(`inspector.llm.level.${level}`),
                  })),
                ]}
                onChange={(event) =>
                  onReasoningChange(
                    chosen.reasoningLevels.find((level) => level === event.target.value) ?? null,
                  )
                }
              />
            )}
          </Field>
        )}
      </InspectorSection>
      {extra.type === NodeType.Completion && (
        <InspectorSection title={t('inspector.completion.input')}>
          <RowList
            aria-label={t('inspector.completion.input')}
            mono={false}
            rows={[
              {
                id: CONVERSATION_ROW_ID,
                name: t('inspector.completion.conversation'),
                meta: t('inspector.hint.wholeConversation'),
              },
            ]}
          />
          <Switch
            label={t('inspector.completion.currentMessage')}
            checked={extra.includeCurrentMessage}
            onCheckedChange={extra.onIncludeCurrentMessageChange}
          />
        </InspectorSection>
      )}
      <InspectorSection title={t('inspector.llm.output')} note={t('inspector.llm.structured')}>
        {step.builtIn.length > 0 && (
          <RowList
            aria-label={t('inspector.llm.builtIn')}
            rows={step.builtIn.map((field) => ({
              id: field.name,
              name: field.name,
              meta: t('inspector.llm.builtInType', { type: t(`inspector.type.${field.type}`) }),
            }))}
          />
        )}
        {step.output.map((field, index) => (
          <OutputFieldRow
            key={[
              index,
              field.name,
              field.type,
              ...(field.type === OutputFieldType.Enum ? field.values : []),
            ].join(LIST_VALUE_SEPARATOR)}
            field={field}
            issue={step.fieldIssues[index] ?? null}
            canRemove={step.canRemoveField}
            onChange={(patch) => onFieldChange(index, patch)}
            onRemove={() => onRemoveField(index)}
          />
        ))}
        <Button
          className="self-start"
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          icon={IconName.Plus}
          disabled={!step.canAddField}
          onClick={onAddField}
        >
          {t('inspector.llm.addField')}
        </Button>
      </InspectorSection>
      {extra.type === NodeType.Agent && (
        <>
          <InspectorSection title={t('inspector.agent.onFailure')}>
            <div className="flex items-center gap-2">
              <Text kind={TextKind.Small} className="min-w-0 flex-1">
                {extra.onFailure.length === 0
                  ? t('inspector.agent.runFails')
                  : t('inspector.agent.goesTo', {
                      name: extra.onFailure.map((target) => target.label).join(LIST_VALUE_JOINER),
                    })}
              </Text>
              <div className="shrink-0">
                <Select
                  aria-label={t('inspector.agent.retriesLabel')}
                  value={String(extra.retries)}
                  options={Array.from({ length: MAX_RETRIES + 1 }, (_, count) => ({
                    value: String(count),
                    label: t('inspector.agent.retries', { count }),
                  }))}
                  onChange={(event) => extra.onRetriesChange(Number(event.target.value))}
                />
              </div>
            </div>
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {t('inspector.agent.failureNote')}
            </Text>
          </InspectorSection>
          <Callout icon={IconName.Info}>{t('inspector.agent.repliesNote')}</Callout>
        </>
      )}
    </>
  );
}
