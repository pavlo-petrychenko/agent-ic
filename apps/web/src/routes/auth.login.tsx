import { createFileRoute } from '@tanstack/react-router';
import { LoginPage, redirectSearchSchema } from '@/features/auth';

export const Route = createFileRoute('/auth/login')({
  validateSearch: redirectSearchSchema,
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect } = Route.useSearch();
  return <LoginPage redirect={redirect} />;
}
