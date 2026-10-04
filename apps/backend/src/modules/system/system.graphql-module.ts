import { Module } from '@nestjs/common';

import { ServerStatusResolver } from './graphql/server-status.resolver';
import { SystemModule } from './system.module';

@Module({
  imports: [SystemModule],
  providers: [ServerStatusResolver],
})
export class SystemGraphqlModule {}
