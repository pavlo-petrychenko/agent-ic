import { Injectable } from '@nestjs/common';
import { toLiveScheduleTriggers } from '@/modules/agents/helpers/schedule-trigger.helpers';
import { LiveScheduleTriggersRepository } from '@/modules/agents/repositories/live-schedule-triggers.repository';
import type { LiveScheduleTrigger } from '@/modules/agents/typedefs/schedule-trigger.typedefs';

@Injectable()
export class ScheduleTriggerDirectoryService {
  constructor(private readonly liveTriggers: LiveScheduleTriggersRepository) {}

  async listLive(): Promise<LiveScheduleTrigger[]> {
    const rows = await this.liveTriggers.listLive();
    return rows.flatMap(toLiveScheduleTriggers);
  }
}
