import { createFileRoute } from '@tanstack/react-router';
import { LandingRedirect, requireLandingSession } from '@/features/auth';

export const Route = createFileRoute('/')({
  beforeLoad: requireLandingSession,
  component: IndexRoute,
});

function IndexRoute() {
  return <LandingRedirect />;
}
