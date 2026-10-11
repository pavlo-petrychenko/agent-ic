import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { OutputViewKind } from '@/features/testing/constants/trace.constants';
import type { OutputView } from '@/features/testing/typedefs/trace.typedefs';
import type { TurnDetailsProps } from '@/features/testing/view/TurnDetails/TurnDetails.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { CodeBlock } from '@/shared/ui/display/CodeBlock';
import { KeyValue, KeyValueLayout } from '@/shared/ui/display/KeyValue';
import { Metric } from '@/shared/ui/display/Metric';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import styles from '@/features/testing/view/TurnDetails/TurnDetails.module.scss';

export function TurnDetails({
  title,
  statusLabel,
  statusTone,
  metrics,
  outputs,
}: TurnDetailsProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

  const body = (view: OutputView) => {
    if (view.kind === OutputViewKind.Fields) {
      return (
        <KeyValue
          layout={KeyValueLayout.Props}
          items={view.fields.map((field) => ({ ...field, mono: true }))}
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
    return (
      <KeyValue
        layout={KeyValueLayout.Props}
        items={[
          { label: t('details.wouldNotify'), value: view.recipients ?? t('details.nobody') },
          {
            label: t('details.flow'),
            value: <Badge tone={BadgeTone.Warn}>{t('details.paused')}</Badge>,
          },
        ]}
      />
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <Heading size={HeadingSize.H3} as={HeadingElement.H2}>
          {title}
        </Heading>
        <Badge tone={statusTone} dot>
          {statusLabel}
        </Badge>
      </div>
      <Metric items={metrics} />
      {outputs.map((output) => (
        <section key={output.id} className={styles.output}>
          <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
            {output.title}
          </Heading>
          {body(output.view)}
        </section>
      ))}
    </div>
  );
}
