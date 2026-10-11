import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { LOGIN_SEARCH_DEFAULTS, LoginPage, loginSearchSchema } from '@/features/auth';

export const Route = createFileRoute('/auth/login')({
  validateSearch: loginSearchSchema,
  search: { middlewares: [stripSearchParams(LOGIN_SEARCH_DEFAULTS)] },
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect, notice } = Route.useSearch();
  return <LoginPage redirect={redirect} notice={notice} />;
}
