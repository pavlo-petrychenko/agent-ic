import { Injectable } from '@nestjs/common';
import { UsageLimits } from '@/platform/llm/services/usage-limits.service';

@Injectable()
export class AllowAllUsageLimits extends UsageLimits {
  async assertPlatformCallAllowed(): Promise<void> {}
}
