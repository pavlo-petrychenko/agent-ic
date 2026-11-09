import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { TourPage } from '@/features/onboarding/constants/tour.constants';
import { TourAnchor } from '@/features/onboarding/constants/tourAnchor.constants';
import {
  TOUR_AGENTS_PATH,
  TOUR_BUILDER_PATH,
  TOUR_CHANNELS_PATH,
  TOUR_TEAM_PATH,
  TOUR_TEMPLATES_OPEN,
  TOUR_TESTING_PATH,
} from '@/features/onboarding/constants/tourRoute.constants';
import { findTourAnchor } from '@/features/onboarding/logic/helpers/tourAnchor.helpers';

export function useTourNavigation(workspaceId: string) {
  const navigate = useNavigate();

  return useMemo(() => {
    const params = { workspaceId };
    const agents = () => void navigate({ to: TOUR_AGENTS_PATH, params });
    const builder = (agentId: string) =>
      void navigate({ to: TOUR_BUILDER_PATH, params: { workspaceId, agentId } });
    const testing = (agentId: string | null) =>
      void navigate({ to: TOUR_TESTING_PATH, params, search: { agent: agentId } });
    const templates = () =>
      void navigate({
        to: TOUR_AGENTS_PATH,
        params,
        search: { templates: TOUR_TEMPLATES_OPEN, template: null },
      });

    return {
      templates,
      channels: () => void navigate({ to: TOUR_CHANNELS_PATH, params }),
      team: () => void navigate({ to: TOUR_TEAM_PATH, params }),
      guides: (agentId: string | null) => {
        const button = findTourAnchor(TourAnchor.BuilderGuides);
        if (button !== null) {
          button.click();
        } else if (agentId === null) {
          agents();
        } else {
          builder(agentId);
        }
      },
      page: (page: TourPage, agentId: string | null) => {
        if (page === TourPage.Testing) {
          testing(agentId);
        } else if (page === TourPage.Builder && agentId !== null) {
          builder(agentId);
        } else if (page === TourPage.Builder) {
          templates();
        } else {
          agents();
        }
      },
    };
  }, [navigate, workspaceId]);
}
