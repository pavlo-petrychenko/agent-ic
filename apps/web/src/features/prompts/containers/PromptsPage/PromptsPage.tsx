import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { NewPromptDialog } from '@/features/prompts/containers/NewPromptDialog';
import { usePromptFolderTree } from '@/features/prompts/logic/hooks/usePromptFolderTree';
import { PromptsEmpty } from '@/features/prompts/view/PromptsEmpty';
import { PromptsNav } from '@/features/prompts/view/PromptsNav';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function PromptsPage() {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { folders, prompts, loading, failed, retry } = usePromptLibrary();
  const { groups, setOpen } = usePromptFolderTree(folders, prompts);
  const [creating, setCreating] = useState(false);

  const openCreate = () => setCreating(true);
  const closeCreate = () => setCreating(false);

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
    return <PromptsEmpty onCreate={openCreate} />;
  };

  return (
    <div className="flex h-full min-h-0">
      <PromptsNav groups={groups} loading={loading} onCreate={openCreate} onOpenChange={setOpen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <div className="flex flex-col gap-5 pb-8">
          <PageHeader title={t('page.title')} subtitle={t('page.subtitle')} />
          <div className="px-7">{body()}</div>
        </div>
      </div>
      {creating && <NewPromptDialog folders={folders} onClose={closeCreate} />}
    </div>
  );
}
