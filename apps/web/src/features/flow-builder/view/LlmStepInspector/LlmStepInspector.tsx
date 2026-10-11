import type { FlowIssue } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { UNSET_OPTION } from '@/features/flow-builder/constants/llmStep.constants';
import type { LlmStepInspectorProps } from '@/features/flow-builder/view/LlmStepInspector/LlmStepInspector.typedefs';
import { OutputFieldRow } from '@/features/flow-builder/view/LlmStepInspector/OutputFieldRow';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { RowList } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Field } from '@/shared/ui/inputs/Field';
import { PromptEditor } from '@/shared/ui/inputs/PromptEditor';
import { Select } from '@/shared/ui/inputs/Select';
import { InspectorSection } from '@/shared/ui/layout/Inspector';

export function LlmStepInspector({
  step,
  onPromptChange,
  onModelChange,
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

  return (
    <>
      <InspectorSection title={t('inspector.llm.prompt')}>
        <PromptEditor
          value={step.prompt}
          variables={step.variables}
          label={t('inspector.llm.prompt')}
          menuLabel={t('inspector.llm.variables')}
          placeholder={t('inspector.llm.promptPlaceholder')}
          error={message(step.promptIssue)}
          onChange={onPromptChange}
        />
      </InspectorSection>
      <InspectorSection title={t('inspector.llm.model')} note={t('inspector.llm.platform')}>
        <Select
          aria-label={t('inspector.llm.model')}
          value={step.model ?? UNSET_OPTION}
          options={modelOptions}
          error={message(step.modelIssue)}
          onChange={(event) => onModelChange(event.target.value)}
        />
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
            key={`${index}:${field.name}:${field.type}`}
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
    </>
  );
}
