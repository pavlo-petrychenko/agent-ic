import { OutputBody } from '@/features/testing/view/OutputBody';
import type { TurnDetailsProps } from '@/features/testing/view/TurnDetails/TurnDetails.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge } from '@/shared/ui/display/Badge';
import { Metric } from '@/shared/ui/display/Metric';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import styles from '@/features/testing/view/TurnDetails/TurnDetails.module.scss';

export function TurnDetails({
  title,
  statusLabel,
  statusTone,
  metrics,
  outputs,
  back = null,
  action = null,
}: TurnDetailsProps) {
  return (
    <div className={styles.root}>
      {back !== null && (
        <Button
          className={styles.back}
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          onClick={back.onBack}
        >
          {back.label}
        </Button>
      )}
      <div className={styles.head}>
        <Heading size={HeadingSize.H3} as={HeadingElement.H2}>
          {title}
        </Heading>
        <Badge tone={statusTone} dot>
          {statusLabel}
        </Badge>
      </div>
      {metrics.length > 0 && <Metric items={metrics} />}
      {outputs.map((output) => (
        <section key={output.id} className={styles.output}>
          <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
            {output.title}
          </Heading>
          <OutputBody view={output.view} />
        </section>
      ))}
      {action}
    </div>
  );
}
