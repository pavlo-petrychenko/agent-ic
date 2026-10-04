import type { Type } from '@nestjs/common';

export interface RoleEntrypoint {
  readonly module: Type<unknown>;
  readonly globalPrefix: string | null;
}
