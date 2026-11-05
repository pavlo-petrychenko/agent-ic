import { createFileRoute } from '@tanstack/react-router';
import { requireSession } from '@/features/auth';
import { GoogleCallbackPage, googleCallbackSearchSchema } from '@/features/knowledge';

export const Route = createFileRoute('/oauth/google/callback')({
  validateSearch: googleCallbackSearchSchema,
  beforeLoad: ({ location }) => requireSession(location),
  component: GoogleCallbackRoute,
});

function GoogleCallbackRoute() {
  const { code, state, error } = Route.useSearch();
  return <GoogleCallbackPage code={code ?? null} state={state ?? null} error={error ?? null} />;
}
