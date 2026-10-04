import { All, Controller, Next, Req, Res, UseGuards } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PlatformAdminGuard } from '@/platform/admin/guards/platform-admin.guard';
import { QueueBoardRoute } from '@/platform/queues/constants/queue-board.constants';
import { QueueBoardService } from '@/platform/queues/services/queue-board.service';

@Controller(QueueBoardRoute.Base)
@UseGuards(PlatformAdminGuard)
export class QueueBoardController {
  constructor(private readonly board: QueueBoardService) {}

  @All([QueueBoardRoute.Root, QueueBoardRoute.Nested])
  handle(@Req() request: Request, @Res() response: Response, @Next() next: NextFunction): void {
    this.board.handle(request, response, next);
  }
}
