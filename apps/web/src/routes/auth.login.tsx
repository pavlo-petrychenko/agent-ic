import { createFileRoute } from '@tanstack/react-router';
import { LoginPage, loginSearchSchema } from '@/features/auth';

export const Route = createFileRoute('/auth/login')({
  validateSearch: loginSearchSchema,
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect, notice } = Route.useSearch();
  return <LoginPage redirect={redirect} notice={notice} />;
}
