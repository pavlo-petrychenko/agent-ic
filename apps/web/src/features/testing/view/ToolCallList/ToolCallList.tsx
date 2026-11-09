import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type {
  ToolCallItemProps,
  ToolCallListProps,
} from '@/features/testing/view/ToolCallList/ToolCallList.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { CodeBlock } from '@/shared/ui/display/CodeBlock';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/view/ToolCallList/ToolCallList.module.scss';

function ToolCallItem({ call, number }: ToolCallItemProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

  return (
    <li className={styles.item}>
      <details className={styles.details}>
        <summary className={styles.summary}>
          <Icon name={IconName.ChevronRight} className={styles.chevron} />
          <span className={styles.number}>{number}</span>
          <span className={styles.name}>{call.name}</span>
          {call.duration !== null && (
            <span className={styles.duration}>
              {t('details.toolCall.duration', { value: call.duration })}
            </span>
          )}
          <Badge tone={call.failed ? BadgeTone.Err : BadgeTone.Ok} dot>
            {call.failed ? t('details.toolCall.status.error') : t('details.toolCall.status.ok')}
          </Badge>
        </summary>
        <div className={styles.body}>
          <div className={styles.part}>
            <span className={styles.label}>{t('details.toolCall.arguments')}</span>
            <CodeBlock code={call.input} />
            {call.inputTruncated && (
              <span className={styles.hint}>{t('details.toolCall.truncated')}</span>
            )}
          </div>
          {call.error !== null && (
            <Callout tone={CalloutTone.Err} icon={IconName.Alert}>
              {call.error}
            </Callout>
          )}
          {call.output !== null && (
            <div className={styles.part}>
              <span className={styles.label}>{t('details.toolCall.result')}</span>
              <CodeBlock code={call.output} />
              {call.outputTruncated && (
                <span className={styles.hint}>{t('details.toolCall.truncated')}</span>
              )}
            </div>
          )}
        </div>
      </details>
    </li>
  );
}

export function ToolCallList({ calls }: ToolCallListProps) {
  return (
    <ol className={styles.root}>
      {calls.map((call, index) => (
        <ToolCallItem key={call.id} call={call} number={index + 1} />
      ))}
    </ol>
  );
}
