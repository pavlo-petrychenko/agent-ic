import { Module } from '@nestjs/common';
import { ServerStatusResolver } from '@/modules/system/graphql/server-status.resolver';
import { SystemModule } from '@/modules/system/system.module';

@Module({
  imports: [SystemModule],
  providers: [ServerStatusResolver],
})
export class SystemGraphqlModule {}
