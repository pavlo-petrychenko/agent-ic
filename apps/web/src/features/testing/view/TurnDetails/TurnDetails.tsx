import { OutputViewKind } from '@/features/testing/constants/trace.constants';
import type { TurnDetailsProps } from '@/features/testing/view/TurnDetails/TurnDetails.typedefs';
import { Badge } from '@/shared/ui/display/Badge';
import { CodeBlock } from '@/shared/ui/display/CodeBlock';
import { KeyValue, KeyValueLayout } from '@/shared/ui/display/KeyValue';
import { Metric } from '@/shared/ui/display/Metric';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import styles from '@/features/testing/view/TurnDetails/TurnDetails.module.scss';

export function TurnDetails({
  title,
  statusLabel,
  statusTone,
  metrics,
  outputs,
}: TurnDetailsProps) {
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
          {output.view.kind === OutputViewKind.Fields ? (
            <KeyValue
              layout={KeyValueLayout.Props}
              items={output.view.fields.map((field) => ({ ...field, mono: true }))}
            />
          ) : (
            <CodeBlock code={output.view.code} />
          )}
        </section>
      ))}
    </div>
  );
}
