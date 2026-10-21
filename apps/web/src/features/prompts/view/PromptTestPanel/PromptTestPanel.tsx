import { Trans, useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { PromptTestSampleKind } from '@/features/prompts/typedefs/promptTest.typedefs';
import type { PromptTestSampleField } from '@/features/prompts/typedefs/promptTest.typedefs';
import { PROMPT_TEST_CHANNEL_OPTIONS } from '@/features/prompts/view/PromptTestPanel/PromptTestPanel.constants';
import type { PromptTestPanelProps } from '@/features/prompts/view/PromptTestPanel/PromptTestPanel.typedefs';
import { WORKSPACE_SECTION_PATHS, WorkspaceSection } from '@/features/workspace';
import { Button } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { TextLink } from '@/shared/ui/actions/TextLink';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { CodeBlock } from '@/shared/ui/display/CodeBlock';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';
import { Textarea } from '@/shared/ui/inputs/Textarea';
import { Panel, PanelSide } from '@/shared/ui/layout/Panel';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/PromptTestPanel/PromptTestPanel.module.scss';

const TESTING_PATH = WORKSPACE_SECTION_PATHS[WorkspaceSection.Testing];

const isTextSample = (field: PromptTestSampleField): boolean =>
  field.kind === PromptTestSampleKind.Text;

export function PromptTestPanel({
  versionLabel,
  variables,
  onVariableChange,
  customerMessage,
  onCustomerMessageChange,
  models,
  modelsLoading,
  model,
  onModelChange,
  running,
  result,
  failed,
  canRun,
  workspaceId,
  onClose,
  onRun,
}: PromptTestPanelProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const channelOptions = PROMPT_TEST_CHANNEL_OPTIONS;
  const textSamples = variables.filter(isTextSample);
  const pairedSamples = variables.filter((field) => !isTextSample(field));

  const sampleField = (field: PromptTestSampleField) => (
    <Field key={field.path} label={field.path}>
      {(control) =>
        field.kind === PromptTestSampleKind.Channel ? (
          <Select
            {...control}
            value={field.value}
            options={channelOptions}
            onChange={(event) => onVariableChange(field.path, event.target.value)}
          />
        ) : (
          <Input
            {...control}
            value={field.value}
            onChange={(event) => onVariableChange(field.path, event.target.value)}
          />
        )
      }
    </Field>
  );

  return (
    <Panel ariaLabel={t('test.title')} className={styles.panel} side={PanelSide.Left} flush>
      <header className={styles.head}>
        <div className={styles.headBody}>
          <h3 className={styles.headTitle}>{t('test.title')}</h3>
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {versionLabel}
          </Text>
        </div>
        <IconButton
          icon={IconName.X}
          size={IconButtonSize.Sm}
          variant={IconButtonVariant.Ghost}
          label={t('test.close')}
          onClick={onClose}
        />
      </header>
      <div className={styles.form}>
        {textSamples.map(sampleField)}
        {pairedSamples.length > 0 && (
          <div className={styles.pair}>{pairedSamples.map(sampleField)}</div>
        )}
        <Field label={t('test.message')} required>
          {(control) => (
            <Textarea
              {...control}
              className={styles.message}
              value={customerMessage}
              onChange={(event) => onCustomerMessageChange(event.target.value)}
            />
          )}
        </Field>
        <Field label={t('test.model')}>
          {(control) =>
            models.length > 0 ? (
              <Select
                {...control}
                value={model ?? ''}
                options={models.map((choice) => ({ value: choice.id, label: choice.label }))}
                onChange={(event) => onModelChange(event.target.value)}
              />
            ) : (
              <Text kind={TextKind.Caption} color={TextColor.Mute}>
                {modelsLoading ? t('test.models.loading') : t('test.models.empty')}
              </Text>
            )
          }
        </Field>
        <Button fullWidth icon={IconName.Play} loading={running} disabled={!canRun} onClick={onRun}>
          {t('test.run')}
        </Button>
        {failed && <Callout tone={CalloutTone.Err}>{t('test.failed')}</Callout>}
        {result !== null && (
          <div className={styles.output}>
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {t('test.output.title', {
                duration: result.durationLabel,
                tokens: t('test.output.tokens', { count: result.tokensCount }),
              })}
            </Text>
            <CodeBlock
              code={result.outputJson}
              language="json"
              copyLabel={t('test.output.copy')}
              wrap
            />
          </div>
        )}
        <Text kind={TextKind.Caption} color={TextColor.Mute} className={styles.footnote}>
          <Trans
            ns={PROMPTS_NAMESPACE}
            i18nKey="test.footnote"
            components={{
              simulator: <TextLink to={TESTING_PATH} params={{ workspaceId }} inline />,
            }}
          />
        </Text>
      </div>
    </Panel>
  );
}
