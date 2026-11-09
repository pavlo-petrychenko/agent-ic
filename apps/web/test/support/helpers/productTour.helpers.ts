import type { MockLink } from '@apollo/client/testing';
import { TourStatus } from '@/features/onboarding/constants/tour.constants';
import { INITIAL_TOUR_STATE } from '@/features/onboarding/constants/tourSteps.constants';
import { storeTourState } from '@/features/onboarding/storage/helpers/tourStorage.helpers';
import { WorkspaceShellDocument } from '@/features/workspace/communication/gql/query/workspaceShell.generated';

const shellUserId = (mock: MockLink.MockedResponse): string | null => {
  if (mock.request.query !== WorkspaceShellDocument) {
    return null;
  }
  const { result } = mock;
  if (typeof result !== 'object' || result === null || !('data' in result)) {
    return null;
  }
  const id: unknown = result.data?.me?.id;
  return typeof id === 'string' ? id : null;
};

export const skipProductTour = (mocks: readonly MockLink.MockedResponse[]): void => {
  for (const mock of mocks) {
    const userId = shellUserId(mock);
    if (userId !== null) {
      storeTourState(userId, { ...INITIAL_TOUR_STATE, status: TourStatus.Dismissed });
    }
  }
};
