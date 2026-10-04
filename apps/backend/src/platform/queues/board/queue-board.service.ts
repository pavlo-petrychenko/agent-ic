import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { GlobalPrefix } from '@/platform/http/http.constants';

import { QueueRegistry } from '../queue.registry';
import { QueueBoardRoute, URL_PATH_SEPARATOR } from './queue-board.constants';
import { relativeToBase } from './queue-board.helpers';
import type { QueueBoardHandler } from './queue-board.typedefs';

@Injectable()
export class QueueBoardService {
  private readonly basePath = [QueueBoardRoute.Root, GlobalPrefix.Api, QueueBoardRoute.Base].join(
    URL_PATH_SEPARATOR,
  );
  private readonly handler: QueueBoardHandler;

  constructor(queues: QueueRegistry) {
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
