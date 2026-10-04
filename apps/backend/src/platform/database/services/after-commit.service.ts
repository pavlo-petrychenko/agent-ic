import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { AFTER_COMMIT_CLS_KEY } from '@/platform/database/constants/after-commit.constants';
import { addToAfterCommitBuffer } from '@/platform/database/helpers/after-commit.helpers';
import type {
  AfterCommitAction,
  AfterCommitBuffer,
} from '@/platform/database/typedefs/after-commit.typedefs';
import { ErrorReporterService } from '@/platform/errors/services/error-reporter.service';

@Injectable()
export class AfterCommitService {
  constructor(
    private readonly cls: ClsService,
    private readonly reporter: ErrorReporterService,
    private readonly traceIds: TraceIdService,
  ) {}

  async schedule(action: AfterCommitAction): Promise<void> {
    const buffer = this.openBuffer();
    if (buffer === null) {
      await action();
      return;
    }
    const traceId = this.traceIds.current();
    addToAfterCommitBuffer(buffer, async () => {
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
    return buffer?.open === true ? buffer : null;
  }
}
