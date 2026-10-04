import { ErrorCode } from '@agent-ic/contracts';
import { ErrorLink } from '@apollo/client/link/error';
import { catchError, from, mergeMap, throwError } from 'rxjs';
import { UNAUTHENTICATED_RETRIED_CONTEXT_KEY } from '@/shared/api/constants/request.constants';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

export const createErrorLink = (onUnauthenticated: () => Promise<boolean>): ErrorLink =>
  new ErrorLink(({ error, operation, forward }) => {
    const appError = toAppError(error);
    const alreadyRetried = operation.getContext()[UNAUTHENTICATED_RETRIED_CONTEXT_KEY] === true;
    if (appError.code !== ErrorCode.Unauthenticated || alreadyRetried) {
      return throwError(() => appError);
    }
    operation.setContext({ [UNAUTHENTICATED_RETRIED_CONTEXT_KEY]: true });
    return from(onUnauthenticated()).pipe(
      mergeMap((refreshed) =>
        refreshed
          ? forward(operation).pipe(
              catchError((retryError: unknown) => throwError(() => toAppError(retryError))),
            )
          : throwError(() => appError),
      ),
    );
  });
