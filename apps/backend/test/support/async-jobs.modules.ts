import { Module } from '@nestjs/common';

import { WorkerAppModule } from '@/entrypoints/worker.app-module';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';

import { auditOnProbeSignedUp, welcomeOnProbeSignedUp } from './async-jobs.definitions';
import { ProbeCallsRecorder } from './probe-calls.recorder';
import {
  AuditProbeListener,
  RecordProbeProcessor,
  RejectProbeProcessor,
  WelcomeProbeListener,
} from './probe.processors';

@Module({
  imports: [
    WorkerAppModule,
    DomainEventsModule.forFeature([welcomeOnProbeSignedUp, auditOnProbeSignedUp]),
  ],
  providers: [
    ProbeCallsRecorder,
    RecordProbeProcessor,
    RejectProbeProcessor,
    WelcomeProbeListener,
    AuditProbeListener,
  ],
})
export class ProbeWorkerModule {}
