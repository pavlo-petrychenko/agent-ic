import { knowledgeToolFallbackDescription } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { knowledgeAgentNames } from '@/features/knowledge/logic/helpers/knowledgeAgentAccess.helpers';
import type { KnowledgeAgentAccessProps } from '@/features/knowledge/view/KnowledgeAgentAccess/KnowledgeAgentAccess.typedefs';
import styles from '@/features/knowledge/view/KnowledgeAgentAccess/KnowledgeAgentAccess.module.scss';

export function KnowledgeAgentAccess({
  knowledgeBase,
  usages,
  loading,
  failed,
  onRetry,
}: KnowledgeAgentAccessProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const agents = knowledgeAgentNames(usages);
  const description =
    knowledgeBase.toolDescription ?? knowledgeToolFallbackDescription(knowledgeBase.name);

  return (
    <section className={styles.card} aria-labelledby="knowledge-agent-access-title">
      <div className={styles.header}>
        <h3 id="knowledge-agent-access-title" className={styles.title}>
          {t('agentAccess.title')}
        </h3>
      </div>
      <dl className={styles.details}>
        <dt>{t('agentAccess.searchName')}</dt>
        <dd>
          <span className={styles.toolName}>{knowledgeBase.toolName}</span>
        </dd>
        <dt>{t('agentAccess.description')}</dt>
        <dd className={styles.description}>{description}</dd>
        <dt>{t('agentAccess.attachedTo')}</dt>
        <dd>
          {failed ? (
            <span className={styles.muted}>
              {t('agentAccess.attachedFailed')}{' '}
              <button type="button" className={styles.retry} onClick={onRetry}>
                {t('retry')}
              </button>
            </span>
          ) : loading ? (
            <span className={styles.muted}>{t('agentAccess.attachedLoading')}</span>
          ) : agents.length === 0 ? (
            <span className={styles.muted}>{t('agentAccess.attachedEmpty')}</span>
          ) : (
            <ul className={styles.agents} aria-label={t('agentAccess.attachedTo')}>
              {agents.map((agent) => (
                <li key={agent} className={styles.agent}>
                  {agent}
                </li>
              ))}
            </ul>
          )}
        </dd>
      </dl>
    </section>
  );
}
