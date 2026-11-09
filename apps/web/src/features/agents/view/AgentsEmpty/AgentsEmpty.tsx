import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { AgentsEmptyProps } from '@/features/agents/view/AgentsEmpty/AgentsEmpty.typedefs';
import { TemplateCard, TemplateCardSize } from '@/features/agents/view/TemplateCard';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/agents/view/AgentsEmpty/AgentsEmpty.module.scss';

export function AgentsEmpty({
  creating,
  canCreate,
  templates,
  onBrowseTemplates,
  onCreateBlank,
  onUseTemplate,
}: AgentsEmptyProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);

  return (
    <Card>
      <EmptyState
        icon={IconName.Agent}
        title={t('empty.title')}
        description={t('empty.description')}
        actions={
          canCreate ? (
            <>
              <Button icon={IconName.Sparkle} onClick={onBrowseTemplates}>
                {t('actions.startFromTemplate')}
              </Button>
              <Button
                variant={ButtonVariant.Secondary}
                icon={IconName.Plus}
                loading={creating}
                onClick={onCreateBlank}
              >
                {t('actions.blankFlow')}
              </Button>
            </>
          ) : null
        }
      />
      {canCreate && templates.length > 0 && (
        <section className={styles.showcase} aria-label={t('empty.templatesLabel')}>
          <p className={styles.kicker}>{t('empty.templatesKicker')}</p>
          <ul className={styles.grid}>
            {templates.map((card) => (
              <li key={card.key} className={styles.item}>
                <TemplateCard
                  card={card}
                  size={TemplateCardSize.Featured}
                  actionLabel={t('empty.useTemplate')}
                  onSelect={onUseTemplate}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  );
}
