import { UsageLimits } from '@/platform/llm/services/usage-limits.service';
import { SamplePlanLimitError } from '@test/support/fixtures/sample-errors.fixture';

export class RecordingUsageLimits extends UsageLimits {
  readonly checks: string[] = [];
  private reached = false;

  reach(): this {
    this.reached = true;
    return this;
  }

  async assertPlatformCallAllowed(workspaceId: string): Promise<void> {
    this.checks.push(workspaceId);
    if (this.reached) {
      throw new SamplePlanLimitError();
    }
  }
}
