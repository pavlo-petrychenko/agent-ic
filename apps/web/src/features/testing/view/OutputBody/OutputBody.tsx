import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { EscalationRow, OutputViewKind } from '@/features/testing/constants/trace.constants';
import type { OutputBodyProps } from '@/features/testing/view/OutputBody/OutputBody.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { CodeBlock } from '@/shared/ui/display/CodeBlock';
import { RowList } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/view/OutputBody/OutputBody.module.scss';

export function OutputBody({ view }: OutputBodyProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

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
  return (
    <RowList
      mono={false}
      rows={[
        {
          id: EscalationRow.Recipients,
          name: t('details.wouldNotify'),
          meta: view.recipients ?? t('details.nobody'),
        },
        {
          id: EscalationRow.Flow,
          name: t('details.flow'),
          meta: <Badge tone={BadgeTone.Warn}>{t('details.paused')}</Badge>,
        },
      ]}
    />
  );
}
