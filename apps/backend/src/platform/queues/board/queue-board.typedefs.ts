import type { NextFunction, Request, Response } from 'express';

export type QueueBoardHandler = (request: Request, response: Response, next: NextFunction) => void;
