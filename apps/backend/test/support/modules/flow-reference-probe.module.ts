import { FLOW_REFERENCE_CHECKER } from '@/modules/agents/constants/flow-reference.constants';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { FakeFlowReferenceChecker } from '@test/support/fakes/flow-reference-checker.fake';

export class FlowReferenceProbeModule extends defineModule({
  providers: [
    FakeFlowReferenceChecker,
    { provide: FLOW_REFERENCE_CHECKER, useExisting: FakeFlowReferenceChecker },
  ],
  exports: [FakeFlowReferenceChecker],
}) {}
