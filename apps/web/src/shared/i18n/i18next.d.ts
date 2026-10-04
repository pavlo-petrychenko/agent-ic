import 'i18next';
import type { Namespace } from '@/shared/i18n/i18n.constants';
import type { resources } from '@/shared/i18n/i18n.resources';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: Namespace.Common;
    resources: (typeof resources)['en'];
  }
}
