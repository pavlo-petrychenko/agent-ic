import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { ApiReplyMode } from '@/features/channels/typedefs/apiChannel.typedefs';
import type { ApiChannelDetailsProps } from '@/features/channels/view/ApiChannelDetails/ApiChannelDetails.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { SegmentedControl } from '@/shared/ui/actions/SegmentedControl';
import { Card, CardPad, CardTone } from '@/shared/ui/display/Card';
import { CodeBlock } from '@/shared/ui/display/CodeBlock';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { ReadonlyValue } from '@/shared/ui/inputs/ReadonlyValue';
import { Select } from '@/shared/ui/inputs/Select';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';

export function ApiChannelDetails({
  channelsLink,
  channel,
  agentOptions,
  agentId,
  replyMode,
  webhook,
  onAgentChange,
  onReplyModeChange,
  onWebhookChange,
  onSave,
  onDelete,
  onRotate,
}: ApiChannelDetailsProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={channel.name}
        subtitle={t('api.channel.subtitle', { agent: channel.agentName })}
        crumbs={
          <Breadcrumb
            ariaLabel={t('telegram.breadcrumb')}
            moreLabel={t('telegram.breadcrumbMore')}
            items={[
              { label: t('telegram.breadcrumbChannels'), to: channelsLink },
              { label: t('api.channel.breadcrumbApi'), to: channelsLink },
            ]}
          />
        }
        actions={
          <>
            <Button variant={ButtonVariant.Danger} onClick={onDelete}>
              {t('api.channel.actions.delete')}
            </Button>
            <Button onClick={onSave}>{t('api.channel.actions.save')}</Button>
          </>
        }
      />
      <div className="grid grid-cols-1 items-start gap-5 px-7 compact:grid-cols-[minmax(18rem,1fr)_minmax(15rem,20rem)]">
        <div className="flex flex-col gap-4">
          <Card title={t('api.channel.endpoint.title')} pad={CardPad.Lg}>
            <div className="flex flex-col gap-1.5">
              <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
                {t('api.channel.endpoint.sendMessage')}
              </Text>
              <ReadonlyValue mono>{channel.endpoint}</ReadonlyValue>
            </div>
            <Field
              label={t('api.channel.endpoint.secretKey')}
              hint={t('api.channel.endpoint.secretHint')}
            >
              {(control) => (
                <div className="flex gap-2">
                  <Input
                    {...control}
                    value={channel.secretMasked}
                    readOnly
                    mono
                    className="min-w-0 flex-1"
                  />
                  <Button variant={ButtonVariant.Secondary} onClick={onRotate}>
                    {t('api.channel.endpoint.rotate')}
                  </Button>
                </div>
              )}
            </Field>
          </Card>
          <Card title={t('api.channel.whoAnswers.title')} pad={CardPad.Lg}>
            <Field label={t('api.channel.whoAnswers.agent')}>
              {(control) => (
                <Select
                  {...control}
                  value={agentId}
                  options={agentOptions}
                  onChange={(event) => onAgentChange(event.target.value)}
                />
              )}
            </Field>
            <div className="flex flex-col gap-1.5">
              <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
                {t('api.channel.whoAnswers.replyLabel')}
              </Text>
              <SegmentedControl
                value={replyMode}
                ariaLabel={t('api.channel.whoAnswers.replyLabel')}
                options={[
                  {
                    value: ApiReplyMode.Response,
                    label: t('api.channel.whoAnswers.replyResponse'),
                  },
                  { value: ApiReplyMode.Webhook, label: t('api.channel.whoAnswers.replyWebhook') },
                ]}
                onValueChange={onReplyModeChange}
              />
              <Text kind={TextKind.Small} color={TextColor.Mute}>
                {t('api.channel.whoAnswers.replyHint')}
              </Text>
            </div>
            <Field
              label={t('api.channel.whoAnswers.webhook')}
              hint={t('api.channel.whoAnswers.webhookHint')}
            >
              {(control) => (
                <Input
                  {...control}
                  value={webhook}
                  mono
                  onChange={(event) => onWebhookChange(event.target.value)}
                />
              )}
            </Field>
          </Card>
        </div>
        <Card title={t('api.channel.example.title')} tone={CardTone.Panel} pad={CardPad.Lg}>
          <CodeBlock code={channel.exampleRequest} />
          <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
            {t('api.channel.example.response')}
          </Heading>
          <CodeBlock code={channel.exampleResponse} />
          <Text kind={TextKind.Small} color={TextColor.Mute}>
            {t('api.channel.example.hint')}
          </Text>
        </Card>
      </div>
    </div>
  );
}
