import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { useCompleteGoogleConnection } from '@/features/knowledge/communication/hooks/useCompleteGoogleConnection';
import { GoogleCallbackFailureReason } from '@/features/knowledge/constants/googleConnection.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { GoogleCallbackPageProps } from '@/features/knowledge/containers/GoogleCallbackPage/GoogleCallbackPage.typedefs';
import {
  clearGoogleConnectionReturn,
  readGoogleConnectionReturn,
} from '@/features/knowledge/logic/helpers/googleConnection.helpers';
import type { GoogleConnectionReturn } from '@/features/knowledge/typedefs/googleConnection.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { releaseWorkspaceId, setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

type CallbackFailure =
  | { readonly kind: 'reason'; readonly reason: GoogleCallbackFailureReason }
  | { readonly kind: 'message'; readonly message: string };

export function GoogleCallbackPage({ code, state, error }: GoogleCallbackPageProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { completeGoogleConnection } = useCompleteGoogleConnection();
  const started = useRef(false);
  const [target] = useState<GoogleConnectionReturn | null>(() => readGoogleConnectionReturn());
  const [failure, setFailure] = useState<CallbackFailure | null>(() => {
    if (error !== null) {
      return { kind: 'reason', reason: GoogleCallbackFailureReason.Denied };
    }
    if (code === null || state === null) {
      return { kind: 'reason', reason: GoogleCallbackFailureReason.Invalid };
    }
    if (target === null) {
      return { kind: 'reason', reason: GoogleCallbackFailureReason.MissingReturn };
    }
    return null;
  });

  useEffect(() => {
    clearGoogleConnectionReturn();
    if (failure !== null || target === null || code === null || state === null) {
      return;
    }
    if (started.current) {
      return;
    }
    started.current = true;
    setWorkspaceId(target.workspaceId);
    void completeGoogleConnection({ code, state })
      .then(() => {
        clearGoogleConnectionReturn();
        return navigate({
          to: '/w/$workspaceId/knowledge',
          params: { workspaceId: target.workspaceId },
          search: { kb: target.knowledgeBaseId },
          replace: true,
        });
      })
      .catch((cause) => {
        releaseWorkspaceId(target.workspaceId);
        setFailure({ kind: 'message', message: errorMessage(toAppError(cause)) });
      });
  }, [code, completeGoogleConnection, errorMessage, failure, navigate, state, target]);

  const back = () => {
    clearGoogleConnectionReturn();
    if (target === null) {
      void navigate({ to: '/' });
      return;
    }
    void navigate({
      to: '/w/$workspaceId/knowledge',
      params: { workspaceId: target.workspaceId },
      search: { kb: target.knowledgeBaseId },
    });
  };

  return (
    <AuthLayout>
      <Card>
        {failure === null ? (
          <EmptyState
            icon={IconName.Spinner}
            title={t('add.googleConnection.callback.title')}
            description={t('add.googleConnection.callback.description')}
          />
        ) : (
          <EmptyState
            icon={IconName.Alert}
            tone={EmptyStateTone.Err}
            title={t('add.googleConnection.callback.failed')}
            description={
              failure.kind === 'reason'
                ? t(`add.googleConnection.callback.${failure.reason}`)
                : failure.message
            }
            actions={<Button onClick={back}>{t('add.googleConnection.callback.back')}</Button>}
          />
        )}
      </Card>
    </AuthLayout>
  );
}
