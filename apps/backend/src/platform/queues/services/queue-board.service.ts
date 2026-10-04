import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { GlobalPrefix } from '@/platform/http/constants/global-prefix.constants';
import { URL_PATH_SEPARATOR } from '@/platform/http/constants/url.constants';
import { QueueBoardRoute } from '@/platform/queues/constants/queue-board.constants';
import { relativeToBase } from '@/platform/queues/helpers/queue-board.helpers';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { QueueBoardHandler } from '@/platform/queues/typedefs/queue-board.typedefs';

@Injectable()
export class QueueBoardService {
  private readonly basePath = [QueueBoardRoute.Root, GlobalPrefix.Api, QueueBoardRoute.Base].join(
    URL_PATH_SEPARATOR,
  );
  private readonly handler: QueueBoardHandler;

  constructor(queues: QueuesService) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath(this.basePath);
    createBullBoard({
      queues: queues.all().map((queue) => new BullMQAdapter(queue)),
      serverAdapter,
    });
    this.handler = serverAdapter.getRouter() as QueueBoardHandler;
  }

  handle(request: Request, response: Response, next: NextFunction): void {
    request.url = relativeToBase(request.url, this.basePath);
    request.baseUrl = this.basePath;
    this.handler(request, response, next);
  }
}
