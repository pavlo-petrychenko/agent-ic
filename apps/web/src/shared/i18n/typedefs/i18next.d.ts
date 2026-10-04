import 'i18next';
import type { Namespace } from '@/shared/i18n/constants/namespace.constants';
import type { resources } from '@/shared/i18n/constants/resources.constants';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: Namespace.Common;
    resources: (typeof resources)['en'];
  }
}
