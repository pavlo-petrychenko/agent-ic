import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptLibrary } from '@/features/prompts/communication/hooks/usePromptLibrary';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { NewPromptDialog } from '@/features/prompts/containers/NewPromptDialog';
import type { PromptsPageProps } from '@/features/prompts/containers/PromptsPage/PromptsPage.typedefs';
import { resolveLandingPromptId } from '@/features/prompts/logic/helpers/promptLanding.helpers';
import { readLastOpenedPromptId } from '@/features/prompts/storage/helpers/promptLastOpenedStorage.helpers';
import { PromptsEmpty } from '@/features/prompts/view/PromptsEmpty';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function PromptsPage({ workspaceId }: PromptsPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { folders, prompts, loading, failed, retry } = usePromptLibrary();
  const [creating, setCreating] = useState(false);
  const landingPromptId = resolveLandingPromptId(prompts, readLastOpenedPromptId(workspaceId));

  useEffect(() => {
    if (landingPromptId === null) {
      return;
    }
    void navigate({
      to: '/w/$workspaceId/prompts/$promptId',
      params: { workspaceId, promptId: landingPromptId },
      replace: true,
    });
  }, [landingPromptId, navigate, workspaceId]);

  if (failed) {
    return (
      <div className="flex flex-col gap-5 pb-8">
        <PageHeader title={t('page.title')} subtitle={t('page.subtitle')} />
        <div className="px-7">
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
        </div>
      </div>
    );
  }

  if (loading || landingPromptId !== null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={t('page.title')} subtitle={t('page.subtitle')} />
      <div className="px-7">
        <PromptsEmpty onCreate={() => setCreating(true)} />
      </div>
      {creating && <NewPromptDialog folders={folders} onClose={() => setCreating(false)} />}
    </div>
  );
}
