import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { scheduleContacts } from '@/modules/conversations/db/schedule-contacts.table';
import type { NewScheduleContact } from '@/modules/conversations/typedefs/schedule-audience.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ScheduleContactsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insertIfAbsent(contact: NewScheduleContact): Promise<boolean> {
    const inserted = await this.txHost.tx
      .insert(scheduleContacts)
      .values({ ...contact, createdAt: this.clock.now() })
      .onConflictDoNothing()
      .returning({ id: scheduleContacts.id });
    return inserted.length > 0;
  }
}
