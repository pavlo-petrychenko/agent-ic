import { useBlocker } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Dialog } from '@/shared/ui/overlays/Dialog';

const saveFailed = () => useFlowBuilderStore.getState().saveState === SaveState.Error;

export function LeaveGuard() {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const blocker = useBlocker({
    shouldBlockFn: saveFailed,
    enableBeforeUnload: saveFailed,
    withResolver: true,
  });

  return (
    <Dialog
      open={blocker.status === 'blocked'}
      onOpenChange={(open) => {
        if (!open) {
          blocker.reset?.();
        }
      }}
      title={t('leave.title')}
      description={t('leave.description')}
      closeLabel={t('leave.stay')}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={blocker.reset}>
            {t('leave.stay')}
          </Button>
          <Button variant={ButtonVariant.Danger} onClick={blocker.proceed}>
            {t('leave.leave')}
          </Button>
        </>
      }
    />
  );
}
