import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { GoogleConnectionIntroProps } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionIntro/GoogleConnectionIntro.typedefs';
import { GOOGLE_CONNECTION_ICON_SIZE } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionPanel.constants';
import { Button } from '@/shared/ui/actions/Button';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionIntro/GoogleConnectionIntro.module.scss';

export function GoogleConnectionIntro({
  hasConnections,
  starting,
  picking,
  onConnect,
}: GoogleConnectionIntroProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const connectLabel = hasConnections
    ? t('add.googleConnection.connectAnother')
    : t('add.googleConnection.connect');

  return (
    <div className={styles.root}>
      <span className={styles.icon}>
        <Icon name={IconName.Note} size={GOOGLE_CONNECTION_ICON_SIZE} />
      </span>
      <div className={styles.text}>
        <span className={styles.title}>{t('add.googleConnection.title')}</span>
        <span className={styles.description}>{t('add.googleConnection.description')}</span>
      </div>
      <Button onClick={onConnect} loading={starting} disabled={picking}>
        {connectLabel}
      </Button>
    </div>
  );
}
