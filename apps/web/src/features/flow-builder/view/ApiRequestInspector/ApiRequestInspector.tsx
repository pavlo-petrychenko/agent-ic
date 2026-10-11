import { HEADER_NAME_PATTERN, MAX_RETRIES, RequestBodyKind } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import {
  API_OUTPUT_HINTS,
  BODY_KINDS,
  FAILURE_MODES,
  HEADER_PARTS,
  HTTP_ERROR_STATUS,
  HTTP_METHODS,
  NEW_HEADER,
  META_JOINER,
  TIMEOUT_SECONDS,
} from '@/features/flow-builder/constants/apiRequest.constants';
import type { ApiOutputHint } from '@/features/flow-builder/constants/apiRequest.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  IssuePathSegment,
  LIST_VALUE_SEPARATOR,
  PATH_JOINER,
} from '@/features/flow-builder/constants/inspector.constants';
import type { ApiRequestInspectorProps } from '@/features/flow-builder/view/ApiRequestInspector/ApiRequestInspector.typedefs';
import { TemplateField } from '@/features/flow-builder/view/TemplateField';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { CodeBlock } from '@/shared/ui/display/CodeBlock';
import { RowList } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function ApiRequestInspector({
  config,
  outputs,
  variables,
  issue,
  test,
  canTest,
  onChange,
  onTemplateChange,
  onCommit,
  onHeaderChange,
  onBodyKindChange,
  onTest,
}: ApiRequestInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const message = (found: FlowIssue | null) =>
    found === null ? null : t(`issue.${found.code}`, { ...found.params });
  const { body, headers } = config;
  const { result } = test;
  const hint = (found: ApiOutputHint | undefined) =>
    found === undefined ? [] : [t(`inspector.api.outputs.${found}`)];
  const numberSelect = (
    label: string,
    value: number,
    choices: readonly number[],
    format: (count: number) => string,
    change: (next: number) => void,
  ) => (
    <Field label={label}>
      {(control) => (
        <Select
          {...control}
          value={String(value)}
          options={[...new Set([...choices, value])]
            .sort((left, right) => left - right)
            .map((choice) => ({ value: String(choice), label: format(choice) }))}
          onChange={(event) => change(Number(event.target.value))}
        />
      )}
    </Field>
  );

  return (
    <>
      <InspectorSection title={t('inspector.api.request')}>
        <Select
          className="w-28"
          aria-label={t('inspector.api.method')}
          value={config.method}
          options={HTTP_METHODS.map((method) => ({ value: method, label: method }))}
          onChange={(event) =>
            onChange({
              method: HTTP_METHODS.find((method) => method === event.target.value) ?? config.method,
            })
          }
        />
        <TemplateField
          label={t('inspector.api.url')}
          value={config.url}
          variables={variables}
          hint={t('inspector.api.urlHint')}
          error={message(issue(IssuePathSegment.Url))}
          placeholder={t('inspector.api.urlPlaceholder')}
          onChange={(url) => onTemplateChange({ url })}
          onCommit={onCommit}
        />
      </InspectorSection>
      <InspectorSection title={t('inspector.api.headers')}>
        {headers.map((header, index) => {
          const partIssue = (part: IssuePathSegment) =>
            issue([IssuePathSegment.Headers, index, part].join(PATH_JOINER));
          const rowIssue = HEADER_PARTS.map(partIssue).find((found) => found !== null) ?? null;
          return (
            <div key={index} className="flex flex-col gap-1">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-1.5">
                {HEADER_PARTS.map((part) => (
                  <Input
                    key={[part, header[part]].join(LIST_VALUE_SEPARATOR)}
                    mono
                    aria-label={t(`inspector.api.header.${part}`, { number: index + 1 })}
                    defaultValue={header[part]}
                    invalid={partIssue(part) !== null}
                    onBlur={(event) => {
                      const next = event.target.value;
                      if (part === IssuePathSegment.Name && !HEADER_NAME_PATTERN.test(next)) {
                        event.target.value = header.name;
                      } else if (next !== header[part]) {
                        onHeaderChange(index, { ...header, [part]: next });
                      }
                    }}
                  />
                ))}
                <IconButton
                  icon={IconName.X}
                  size={IconButtonSize.Xs}
                  label={t('inspector.api.removeHeader', { name: header.name })}
                  onClick={() => onHeaderChange(index, null)}
                />
              </div>
              {rowIssue !== null && (
                <Text kind={TextKind.Caption} color={TextColor.Err}>
                  {message(rowIssue)}
                </Text>
              )}
            </div>
          );
        })}
        <Button
          className="self-start"
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          icon={IconName.Plus}
          onClick={() => onHeaderChange(headers.length, NEW_HEADER)}
        >
          {t('inspector.api.addHeader')}
        </Button>
      </InspectorSection>
      <InspectorSection title={t('inspector.api.body')}>
        <Select
          aria-label={t('inspector.api.bodyKind')}
          value={body.kind}
          options={BODY_KINDS.map((kind) => ({
            value: kind,
            label: t(`inspector.api.bodyKinds.${kind}`),
          }))}
          onChange={(event) =>
            onBodyKindChange(BODY_KINDS.find((kind) => kind === event.target.value) ?? body.kind)
          }
        />
        {body.kind !== RequestBodyKind.None && (
          <TemplateField
            label={t('inspector.api.content')}
            value={body.content}
            variables={variables}
            hint={null}
            error={message(
              issue([IssuePathSegment.Body, IssuePathSegment.Content].join(PATH_JOINER)),
            )}
            placeholder={null}
            onChange={(content) => onTemplateChange({ body: { kind: body.kind, content } })}
            onCommit={onCommit}
          />
        )}
      </InspectorSection>
      <InspectorSection title={t('inspector.api.output')} note={t('inspector.api.outputNote')}>
        <RowList
          aria-label={t('inspector.api.output')}
          rows={outputs.map((output) => ({
            id: output.path,
            name: output.path,
            meta: [t(`inspector.type.${output.type}`), ...hint(API_OUTPUT_HINTS[output.path])].join(
              META_JOINER,
            ),
          }))}
        />
      </InspectorSection>
      <InspectorSection title={t('inspector.api.onFailure')}>
        <div className="grid grid-cols-2 gap-2">
          {numberSelect(
            t('inspector.api.timeout'),
            config.timeoutSeconds,
            TIMEOUT_SECONDS,
            (count) => t('inspector.api.seconds', { count }),
            (timeoutSeconds) => onChange({ timeoutSeconds }),
          )}
          {numberSelect(
            t('inspector.api.retries'),
            config.retries,
            Array.from({ length: MAX_RETRIES + 1 }, (_, count) => count),
            (count) => t('inspector.api.retryCount', { count }),
            (retries) => onChange({ retries }),
          )}
        </div>
        <Select
          aria-label={t('inspector.api.onFailure')}
          value={config.onFailure}
          options={FAILURE_MODES.map((mode) => ({
            value: mode,
            label: t(`inspector.api.failure.${mode}`),
          }))}
          error={message(issue(IssuePathSegment.OnFailure))}
          onChange={(event) =>
            onChange({
              onFailure:
                FAILURE_MODES.find((mode) => mode === event.target.value) ?? config.onFailure,
            })
          }
        />
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t(`inspector.api.failureNote.${config.onFailure}`)}
        </Text>
      </InspectorSection>
      <Button
        className="self-start"
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Sm}
        icon={IconName.Play}
        loading={test.running}
        disabled={!canTest}
        onClick={onTest}
      >
        {t('inspector.api.test')}
      </Button>
      {!canTest && (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('inspector.api.saveFirst')}
        </Text>
      )}
      {test.failed && <Callout tone={CalloutTone.Err}>{t('inspector.api.testFailed')}</Callout>}
      {result !== null && result.status === null && (
        <Callout tone={CalloutTone.Err}>{t(`inspector.api.outcome.${result.outcome}`)}</Callout>
      )}
      {result !== null && result.status !== null && (
        <>
          <Callout tone={result.status < HTTP_ERROR_STATUS ? CalloutTone.Ok : CalloutTone.Warn}>
            {t('inspector.api.responded', { status: result.status, ms: result.durationMs })}
          </Callout>
          {result.body !== null && (
            <CodeBlock aria-label={t('inspector.api.responseBody')} code={result.body} wrap />
          )}
          {result.bodyTruncated && (
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {t('inspector.api.truncated')}
            </Text>
          )}
        </>
      )}
    </>
  );
}
