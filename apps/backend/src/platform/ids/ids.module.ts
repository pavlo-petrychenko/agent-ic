import { Global, Module } from '@nestjs/common';
import { IdService } from '@/platform/ids/services/id.service';

@Global()
@Module({
  providers: [IdService],
  exports: [IdService],
})
export class IdsModule {}
