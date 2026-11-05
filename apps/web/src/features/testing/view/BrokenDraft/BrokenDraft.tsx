import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { MORE_ISSUES_SHOWN } from '@/features/testing/view/BrokenDraft/BrokenDraft.constants';
import type { BrokenDraftProps } from '@/features/testing/view/BrokenDraft/BrokenDraft.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/view/BrokenDraft/BrokenDraft.module.scss';

export function BrokenDraft({ draftName, issues, onOpen }: BrokenDraftProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const [first, ...rest] = issues;
  const more = rest.slice(0, MORE_ISSUES_SHOWN);
  const step = first?.step ?? null;

  return (
    <div className={styles.root}>
      <EmptyState
        icon={IconName.Alert}
        tone={EmptyStateTone.Warn}
        title={step === null ? t('brokenDraft.title') : t('brokenDraft.titleStep', { step })}
        description={
          first === undefined
            ? t('brokenDraft.description')
            : t('brokenDraft.issueDescription', { issue: first.message, draft: draftName })
        }
        actions={
          <Button onClick={() => onOpen(first?.nodeId ?? null)}>
            {step === null ? t('brokenDraft.action') : t('brokenDraft.openStep', { step })}
          </Button>
        }
      />
      {rest.length > 0 && (
        <section className={styles.more}>
          <h3 className={styles.heading}>{t('brokenDraft.more', { count: rest.length })}</h3>
          <ul className={styles.list}>
            {more.map((issue) => (
              <li key={issue.id} className={styles.item}>
                <span className={styles.text}>
                  {issue.step !== null && <span className={styles.step}>{issue.step}</span>}
                  <span>{issue.message}</span>
                </span>
                <Button
                  variant={ButtonVariant.Ghost}
                  size={ButtonSize.Sm}
                  onClick={() => onOpen(issue.nodeId)}
                >
                  {t(issue.nodeId === null ? 'brokenDraft.action' : 'brokenDraft.openOther')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
