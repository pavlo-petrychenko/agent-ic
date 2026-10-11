import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { TRACE_NODE } from '@/features/testing/constants/trace.constants';
import type { RunTraceProps } from '@/features/testing/view/RunTrace/RunTrace.typedefs';
import { RunNode } from '@/shared/ui/flow/RunNode';
import styles from '@/features/testing/view/RunTrace/RunTrace.module.scss';

export function RunTrace({ drawing, onSelectNode }: RunTraceProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const { size, nodes, paths } = drawing;

  return (
    <div className={styles.root} style={{ width: size.x, height: size.y }}>
      <svg
        className={styles.edges}
        width={size.x}
        height={size.y}
        viewBox={`0 0 ${size.x} ${size.y}`}
        aria-hidden="true"
      >
        {paths.map((path) => (
          <path key={path.id} d={path.d} />
        ))}
      </svg>
      <ol className={styles.nodes} aria-label={t('trace.steps')}>
        {nodes.map((node) => (
          <RunNode
            key={node.id}
            name={node.label}
            kind={node.kind}
            icon={node.icon}
            state={node.state}
            stateLabel={t(`trace.state.${node.state}`)}
            className={styles.node}
            style={{ left: node.x, top: node.y, width: TRACE_NODE.width }}
            selected={node.selected}
            onSelect={node.selectable ? () => onSelectNode(node.id) : null}
          />
        ))}
      </ol>
    </div>
  );
}
