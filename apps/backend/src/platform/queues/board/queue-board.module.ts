import { Module } from '@nestjs/common';
import { QueueBoardController } from '@/platform/queues/board/queue-board.controller';
import { QueueBoardService } from '@/platform/queues/board/queue-board.service';

@Module({
  controllers: [QueueBoardController],
  providers: [QueueBoardService],
})
export class QueueBoardModule {}
