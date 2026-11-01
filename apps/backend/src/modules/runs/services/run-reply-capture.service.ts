import { Injectable } from '@nestjs/common';
import { runReplyCaptureEntry } from '@/modules/runs/constants/run-reply.constants';
import { CacheService } from '@/platform/cache/services/cache.service';

@Injectable()
export class RunReplyCaptureService {
  constructor(private readonly cache: CacheService) {}

  start(runId: string): Promise<void> {
    return this.cache.set(runReplyCaptureEntry(runId), true);
  }

  async captures(runId: string): Promise<boolean> {
    return (await this.cache.get(runReplyCaptureEntry(runId))) === true;
  }

  stop(runId: string): Promise<void> {
    return this.cache.delete(runReplyCaptureEntry(runId));
  }
}
