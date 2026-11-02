import type { InboxDetailsProps } from '@/features/inbox/typedefs/inbox.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card } from '@/shared/ui/display/Card';
import { KeyValue } from '@/shared/ui/display/KeyValue';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/inbox/view/InboxDetails/InboxDetails.module.scss';

export function InboxDetails({
  label,
  title,
  guard,
  run,
  conversation,
  sessionLinkLabel,
}: InboxDetailsProps) {
  return (
    <aside className={styles.root} aria-label={label}>
      {guard === null && run === null ? null : <h2 className={styles.title}>{title}</h2>}
      {guard === null ? null : (
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconTile}>
              <Icon name={IconName.Msg} size={14} />
            </span>
            <h3 className={styles.cardTitle}>{guard.title}</h3>
            <Badge tone={BadgeTone.Neutral}>{guard.badge}</Badge>
          </div>
          <div className={styles.guardCode}>
            {guard.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </Card>
      )}
      {run === null ? null : (
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{run.title}</h3>
            <button type="button" className={styles.cardLink}>
              {run.linkLabel}
            </button>
          </div>
          <ol className={styles.steps}>
            {run.steps.map((step) => (
              <li key={step.id} className={styles.step}>
                <span className={styles.stepIcon}>
                  <Icon name={step.icon} size={12} />
                </span>
                <span className={styles.stepLabel}>{step.label}</span>
                {step.value === null ? null : (
                  <span className={styles.stepValue}>{step.value}</span>
                )}
              </li>
            ))}
          </ol>
          <p className={styles.runFooter}>{run.footer}</p>
        </Card>
      )}
      <Card title={conversation.title} className={styles.card}>
        <KeyValue
          items={conversation.rows.map((row) => ({
            label: row.label,
            value:
              row.badge === null ? row.value : <Badge tone={BadgeTone.Violet}>{row.badge}</Badge>,
          }))}
        />
      </Card>
      {sessionLinkLabel === null ? null : (
        <button type="button" className={styles.sessionLink}>
          {sessionLinkLabel}
        </button>
      )}
    </aside>
  );
}
