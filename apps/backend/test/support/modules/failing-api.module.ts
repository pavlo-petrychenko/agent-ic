import { Module } from '@nestjs/common';
import { ApiAppModule } from '@/entrypoints/api.app-module';
import { FailingController } from '@test/support/controllers/failing.controller';

@Module({
  imports: [ApiAppModule],
  controllers: [FailingController],
})
export class FailingApiModule {}
