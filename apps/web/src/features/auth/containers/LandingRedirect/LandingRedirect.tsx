import { useEffect, useState } from 'react';
import { useLandingWorkspace } from '@/features/auth/communication/hooks/useLandingWorkspace';
import { useEnterApp } from '@/features/auth/logic/hooks/useEnterApp';
import type { AppError } from '@/shared/api/errors/app.error';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

export function LandingRedirect() {
  const enterApp = useEnterApp(useLandingWorkspace(), { replace: true });
  const [failure, setFailure] = useState<AppError | null>(null);

  useEffect(() => {
    enterApp(null).catch((error: unknown) => setFailure(toAppError(error)));
  }, [enterApp]);

  if (failure !== null) {
    throw failure;
  }
  return null;
}
