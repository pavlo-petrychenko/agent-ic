import { Module } from '@nestjs/common';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { auditOnProbeSignedUp } from '@test/support/jobs/audit-on-probe-signed-up.job';
import { welcomeOnProbeSignedUp } from '@test/support/jobs/welcome-on-probe-signed-up.job';
import { AuditProbeListener } from '@test/support/processors/audit-probe-listener.processor';
import { RecordProbeProcessor } from '@test/support/processors/record-probe.processor';
import { RejectProbeProcessor } from '@test/support/processors/reject-probe.processor';
import { WelcomeProbeListener } from '@test/support/processors/welcome-probe-listener.processor';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';

@Module({
  imports: [DomainEventsModule.forFeature([welcomeOnProbeSignedUp, auditOnProbeSignedUp])],
  providers: [
    ProbeCallsRecorderService,
    RecordProbeProcessor,
    RejectProbeProcessor,
    WelcomeProbeListener,
    AuditProbeListener,
  ],
})
export class ProbeWorkerModule {}
