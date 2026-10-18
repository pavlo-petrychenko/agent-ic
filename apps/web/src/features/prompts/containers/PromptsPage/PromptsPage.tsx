import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { NewPromptDialog } from '@/features/prompts/containers/NewPromptDialog';
import { PromptsEmpty } from '@/features/prompts/view/PromptsEmpty';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function PromptsPage() {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { folders, prompts, loading, failed, retry } = usePromptLibrary();
  const [creating, setCreating] = useState(false);

  const body = () => {
    if (failed) {
      return (
        <Card>
          <EmptyState
            icon={IconName.Alert}
            tone={EmptyStateTone.Err}
            title={t('loadError')}
            actions={
              <Button variant={ButtonVariant.Secondary} onClick={() => void retry()}>
                {t('retry')}
              </Button>
            }
          />
        </Card>
      );
    }
    if (loading || prompts.length > 0) {
      return null;
    }
    return <PromptsEmpty onCreate={() => setCreating(true)} />;
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={t('page.title')} subtitle={t('page.subtitle')} />
      <div className="px-7">{body()}</div>
      {creating && <NewPromptDialog folders={folders} onClose={() => setCreating(false)} />}
    </div>
  );
}
