import { Module } from '@nestjs/common';

import { QueueBoardController } from './queue-board.controller';
import { QueueBoardService } from './queue-board.service';

@Module({
  controllers: [QueueBoardController],
  providers: [QueueBoardService],
})
export class QueueBoardModule {}
