import { INVALID_FLOW_REFERENCE_CHECKER_MESSAGE } from '@/modules/agents/constants/flow-reference.constants';

export class InvalidFlowReferenceCheckerError extends Error {
  constructor() {
    super(INVALID_FLOW_REFERENCE_CHECKER_MESSAGE);
    this.name = new.target.name;
  }
}
