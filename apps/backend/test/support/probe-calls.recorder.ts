import { Injectable } from '@nestjs/common';

import type { ProbeCall } from './async-jobs.typedefs';

@Injectable()
export class ProbeCallsRecorder {
  readonly calls: ProbeCall[] = [];

  record(call: ProbeCall): void {
    this.calls.push(call);
  }

  probeIds(): string[] {
    return this.calls.map((call) => call.probeId);
  }
}
