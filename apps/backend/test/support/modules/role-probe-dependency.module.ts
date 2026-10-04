import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import {
  ROLE_PROBE_DEPENDENCY_TOKEN,
  ROLE_PROBE_DEPENDENCY_VALUE,
} from '@test/support/constants/module-roles.constants';

export class RoleProbeDependencyModule extends defineModule({
  providers: [{ provide: ROLE_PROBE_DEPENDENCY_TOKEN, useValue: ROLE_PROBE_DEPENDENCY_VALUE }],
  exports: [ROLE_PROBE_DEPENDENCY_TOKEN],
}) {}
