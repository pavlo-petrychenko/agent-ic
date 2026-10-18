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
  UNSET_OPTION,
} from '@/features/flow-builder/constants/llmStep.constants';
import type { LlmStepInspectorProps } from '@/features/flow-builder/view/LlmStepInspector/LlmStepInspector.typedefs';
import { OutputFieldRow } from '@/features/flow-builder/view/LlmStepInspector/OutputFieldRow';
import { PromptField } from '@/features/prompts';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { RowList } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';
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
  onRetryModels,
  onReasoningChange,
  onAddField,
  onFieldChange,
  onRemoveField,
}: LlmStepInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const message = (issue: FlowIssue | null) =>
    issue === null ? null : t(`issue.${issue.code}`, { ...issue.params });
  const chosen = step.models.find((model) => model.id === step.model) ?? null;
  const modelOptions = [
    ...(step.model === null
      ? [{ value: UNSET_OPTION, label: t('inspector.llm.pickModel'), disabled: true }]
      : []),
    ...(step.model !== null && chosen === null ? [{ value: step.model, label: step.model }] : []),
    ...step.models.map((model) => ({
      value: model.id,
      label: t('inspector.llm.modelOption', {
        label: model.label,
        vendor: t(`inspector.llm.vendor.${model.vendor}`),
        input: model.inputPrice,
        output: model.outputPrice,
      }),
    })),
  ];
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
            label={t('inspector.llm.prompt')}
            menuLabel={t('inspector.llm.variables')}
            placeholder={t('inspector.llm.promptPlaceholder')}
            error={message(step.promptIssue)}
            onChange={onPromptChange}
          />
        </div>
      </InspectorSection>
      <InspectorSection title={t('inspector.llm.model')} note={t('inspector.llm.platform')}>
        <Select
          aria-label={t('inspector.llm.model')}
          value={step.model ?? UNSET_OPTION}
          options={modelOptions}
          error={message(step.modelIssue)}
          disabled={step.modelsLoading}
          onChange={(event) => onModelChange(event.target.value)}
        />
        {step.modelsFailed && (
          <Callout
            tone={CalloutTone.Err}
            action={
              <Button variant={ButtonVariant.Ghost} size={ButtonSize.Sm} onClick={onRetryModels}>
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
