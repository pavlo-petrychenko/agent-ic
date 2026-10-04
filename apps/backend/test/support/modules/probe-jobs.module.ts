import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { AuditProbeListener } from '@test/support/processors/audit-probe-listener.processor';
import { RecordProbeProcessor } from '@test/support/processors/record-probe.processor';
import { RejectProbeProcessor } from '@test/support/processors/reject-probe.processor';
import { ScheduledProbeProcessor } from '@test/support/processors/scheduled-probe.processor';
import { WelcomeProbeListener } from '@test/support/processors/welcome-probe-listener.processor';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';

export class ProbeJobsModule extends defineModule({
  providers: [ProbeCallsRecorderService],
  exports: [ProbeCallsRecorderService],
  processors: [RecordProbeProcessor, RejectProbeProcessor, ScheduledProbeProcessor],
  listeners: [WelcomeProbeListener, AuditProbeListener],
}) {}
