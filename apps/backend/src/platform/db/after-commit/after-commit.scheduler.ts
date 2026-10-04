import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

import { ErrorReporter } from '@/platform/errors/error.reporter';
import { TraceIdService } from '@/platform/context/trace-id.service';

import type { AfterCommitBuffer } from './after-commit.buffer';
import { AFTER_COMMIT_CLS_KEY } from './after-commit.constants';
import type { AfterCommitAction } from './after-commit.typedefs';

@Injectable()
export class AfterCommitScheduler {
  constructor(
    private readonly cls: ClsService,
    private readonly reporter: ErrorReporter,
    private readonly traceIds: TraceIdService,
  ) {}

  async schedule(action: AfterCommitAction): Promise<void> {
    const buffer = this.openBuffer();
    if (buffer === null) {
      await action();
      return;
    }
    const traceId = this.traceIds.current();
    buffer.add(async () => {
      try {
        await action();
      } catch (error) {
        this.reporter.report(error, traceId);
      }
    });
  }

  private openBuffer(): AfterCommitBuffer | null {
    if (!this.cls.isActive()) {
      return null;
    }
    const buffer = this.cls.get<AfterCommitBuffer | undefined>(AFTER_COMMIT_CLS_KEY);
    return buffer?.isOpen() === true ? buffer : null;
  }
}
