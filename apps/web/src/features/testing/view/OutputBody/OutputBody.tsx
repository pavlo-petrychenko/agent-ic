import { EscalationMode, RecipientsKind } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import {
  EMPTY_FIELD_VALUE,
  ExitPath,
  OutputViewKind,
} from '@/features/testing/constants/trace.constants';
import type {
  AgentExitView,
  EscalationView,
  ExitRecipients,
} from '@/features/testing/typedefs/trace.typedefs';
import type {
  ExitDetailsProps,
  OutputBodyProps,
} from '@/features/testing/view/OutputBody/OutputBody.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { CodeBlock } from '@/shared/ui/display/CodeBlock';
import { KeyValue, KeyValueLayout } from '@/shared/ui/display/KeyValue';
import type { KeyValueItem } from '@/shared/ui/display/KeyValue';
import { RowList } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/view/OutputBody/OutputBody.module.scss';

function ExitDetails({ items, messageLabel, message }: ExitDetailsProps) {
  return (
    <div className={styles.exit}>
      <KeyValue layout={KeyValueLayout.DefList} items={items} />
      <div className={styles.message}>
        <span className={styles.messageLabel}>{messageLabel}</span>
        <p className={styles.messageText}>{message}</p>
      </div>
    </div>
  );
}

export function OutputBody({ view }: OutputBodyProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const { t: tCommon } = useTranslation();

  const recipientsLabel = (recipients: ExitRecipients): string => {
    if (recipients.kind === RecipientsKind.Role) {
      return t('details.exit.recipients.role', { role: tCommon(`roles.name.${recipients.role}`) });
    }
    return recipients.kind === RecipientsKind.Users
      ? t('details.exit.recipients.users', { count: recipients.count })
      : t('details.exit.recipients.operators');
  };

  const recipientsItem = (recipients: ExitRecipients | null): KeyValueItem[] =>
    recipients === null
      ? []
      : [{ label: t('details.exit.recipientsLabel'), value: recipientsLabel(recipients) }];

  const escalation = (exit: EscalationView) => {
    const escalate = exit.mode === EscalationMode.Escalate;
    const handOff: KeyValueItem[] = escalate
      ? [
          { label: t('details.exit.reason'), value: exit.reason ?? EMPTY_FIELD_VALUE },
          ...recipientsItem(exit.recipients),
          { label: t('details.wouldNotify'), value: exit.wouldNotify ?? t('details.nobody') },
          {
            label: t('details.flow'),
            value: exit.resumed ? (
              <Badge tone={BadgeTone.Ok}>{t('details.resumed')}</Badge>
            ) : (
              <Badge tone={BadgeTone.Warn}>{t('details.paused')}</Badge>
            ),
          },
        ]
      : [];
    return (
      <ExitDetails
        items={[
          { label: t('details.exit.mode'), value: t(`details.exit.modes.${exit.mode}`) },
          ...handOff,
        ]}
        messageLabel={t('details.exit.customerMessage')}
        message={exit.message ?? t('details.exit.noMessage')}
      />
    );
  };

  const agentExit = (exit: AgentExitView) => (
    <ExitDetails
      items={[
        { label: t('details.exit.outcome'), value: t(`details.exit.outcomes.${exit.outcome}`) },
        { label: t('details.exit.reason'), value: exit.reason ?? EMPTY_FIELD_VALUE },
        {
          label: t('details.exit.path'),
          value:
            exit.path === ExitPath.Default
              ? t(`details.exit.defaultPath.${exit.outcome}`)
              : t('details.exit.connectedPath', { name: exit.next ?? EMPTY_FIELD_VALUE }),
        },
        ...recipientsItem(exit.recipients),
      ]}
      messageLabel={t(`details.exit.agentMessage.${exit.outcome}`)}
      message={
        exit.path === ExitPath.Default
          ? (exit.message ?? t('details.exit.noMessage'))
          : t('details.exit.connectedMessage', { name: exit.next ?? EMPTY_FIELD_VALUE })
      }
    />
  );

  if (view.kind === OutputViewKind.Fields) {
    return (
      <RowList
        rows={view.fields.map(({ label, value }) => ({
          id: label,
          name: label,
          meta: <span className={styles.value}>{value}</span>,
        }))}
      />
    );
  }
  if (view.kind === OutputViewKind.Json) {
    return <CodeBlock code={view.code} />;
  }
  if (view.kind === OutputViewKind.Error) {
    return (
      <Callout tone={CalloutTone.Err} icon={IconName.Alert}>
        {view.message ?? t('details.stepFailed')}
      </Callout>
    );
  }
  if (view.kind === OutputViewKind.AgentExit) {
    return agentExit(view);
  }
  if (view.kind === OutputViewKind.AutoClose) {
    return (
      <ExitDetails
        items={[
          { label: t('details.exit.mode'), value: t('details.exit.autoClose.mode') },
          {
            label: t('details.exit.reason'),
            value:
              view.after === null
                ? EMPTY_FIELD_VALUE
                : t('details.exit.autoClose.reason', { after: view.after }),
          },
          { label: t('details.exit.autoClose.next'), value: t('details.exit.autoClose.newChat') },
        ]}
        messageLabel={t('details.exit.customerMessage')}
        message={t('details.exit.autoClose.silent')}
      />
    );
  }
  return escalation(view);
}
