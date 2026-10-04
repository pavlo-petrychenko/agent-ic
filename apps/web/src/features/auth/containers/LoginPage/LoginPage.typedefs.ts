import type { LoginNotice } from '@/features/auth/constants/authRoute.constants';

export interface LoginPageProps {
  redirect: string | null;
  notice: LoginNotice | null;
}
