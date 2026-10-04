import { Injectable } from '@nestjs/common';
import type { ProbeCall } from '@test/support/typedefs/async-jobs.typedefs';

@Injectable()
export class ProbeCallsRecorderService {
  readonly calls: ProbeCall[] = [];

  record(call: ProbeCall): void {
    this.calls.push(call);
  }

  probeIds(): string[] {
    return this.calls.map((call) => call.probeId);
  }
}
