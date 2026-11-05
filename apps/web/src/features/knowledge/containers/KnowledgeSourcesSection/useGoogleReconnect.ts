import { useCallback } from 'react';
import { useStartGoogleConnection } from '@/features/knowledge/communication/hooks/useStartGoogleConnection';
import {
  redirectToGoogle,
  saveGoogleConnectionReturn,
} from '@/features/knowledge/logic/helpers/googleConnection.helpers';
import type { UseGoogleReconnectResult } from '@/features/knowledge/typedefs/googleConnection.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useGoogleReconnect(
  workspaceId: string,
  knowledgeBaseId: string,
): UseGoogleReconnectResult {
  const { startGoogleConnection, starting } = useStartGoogleConnection();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const reconnect = useCallback(async () => {
    try {
      const authorizationUrl = await startGoogleConnection();
      saveGoogleConnectionReturn({ workspaceId, knowledgeBaseId });
      redirectToGoogle(authorizationUrl);
    } catch (failure) {
      showToast({ message: errorMessage(toAppError(failure)), tone: ToastTone.Err });
    }
  }, [errorMessage, knowledgeBaseId, showToast, startGoogleConnection, workspaceId]);

  return { reconnect, starting };
}
