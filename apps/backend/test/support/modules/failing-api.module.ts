import { Module } from '@nestjs/common';
import { FailingController } from '@test/support/controllers/failing.controller';

@Module({
  controllers: [FailingController],
})
export class FailingApiModule {}
