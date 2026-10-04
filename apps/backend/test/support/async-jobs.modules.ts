import { Module } from '@nestjs/common';
import { WorkerAppModule } from '@/entrypoints/worker.app-module';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { auditOnProbeSignedUp, welcomeOnProbeSignedUp } from '@test/support/async-jobs.definitions';
import { ProbeCallsRecorder } from '@test/support/probe-calls.recorder';
import {
  AuditProbeListener,
  RecordProbeProcessor,
  RejectProbeProcessor,
  WelcomeProbeListener,
} from '@test/support/probe.processors';

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
