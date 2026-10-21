import type { PromptDetailsSectionProps } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsSection/PromptDetailsSection.typedefs';
import styles from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsSection/PromptDetailsSection.module.scss';

export function PromptDetailsSection({ title, action, children }: PromptDetailsSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h3 className={styles.title}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
