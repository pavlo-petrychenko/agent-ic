import type { ReactNode } from 'react';
import type { AppProps } from '@/app/typedefs/app.typedefs';

export interface AppProvidersProps extends AppProps {
  children: ReactNode;
}
