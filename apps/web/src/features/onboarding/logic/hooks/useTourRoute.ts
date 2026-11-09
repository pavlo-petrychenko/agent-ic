import { useMatchRoute, useSearch } from '@tanstack/react-router';
import { TourPage } from '@/features/onboarding/constants/tour.constants';
import {
  TOUR_AGENTS_PATH,
  TOUR_BUILDER_PATH,
  TOUR_TESTING_PATH,
  TOUR_VERSIONS_PATH,
} from '@/features/onboarding/constants/tourRoute.constants';
import type { TourRoute } from '@/features/onboarding/typedefs/tour.typedefs';

export function useTourRoute(): TourRoute {
  const matchRoute = useMatchRoute();
  const search = useSearch({ strict: false });
  const searchAgent = typeof search.agent === 'string' ? search.agent : null;
  const builder = matchRoute({ to: TOUR_BUILDER_PATH });

  if (builder !== false) {
    return { page: TourPage.Builder, agentId: builder.agentId, versionsAgentId: null };
  }
  if (matchRoute({ to: TOUR_AGENTS_PATH }) !== false) {
    return { page: TourPage.Agents, agentId: null, versionsAgentId: null };
  }
  if (matchRoute({ to: TOUR_TESTING_PATH }) !== false) {
    return { page: TourPage.Testing, agentId: searchAgent, versionsAgentId: null };
  }
  if (matchRoute({ to: TOUR_VERSIONS_PATH }) !== false) {
    return { page: null, agentId: searchAgent, versionsAgentId: searchAgent };
  }
  return { page: null, agentId: null, versionsAgentId: null };
}
