import 'i18next';

import type { Namespace } from './i18n.constants';
import type { resources } from './i18n.resources';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: Namespace.Common;
    resources: (typeof resources)['en'];
  }
}
