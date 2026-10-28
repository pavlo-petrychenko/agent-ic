import type { TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { channelEvents } from '@/modules/channels/db/channel-events.table';
import type { ChannelEventRecord } from '@/modules/channels/typedefs/channel-event.typedefs';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

export const channelEventsFor = (
  module: TestingModule,
  channelId: string,
): Promise<ChannelEventRecord[]> =>
  module
    .get(SystemDatabaseService)
    .db.select()
    .from(channelEvents)
    .where(eq(channelEvents.channelId, channelId));
