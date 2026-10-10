import type { FlowDocument, FlowIssue } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { FLOW_REFERENCE_CHECKER } from '@/modules/agents/constants/flow-reference.constants';
import { FlowReferenceChecker } from '@/modules/agents/services/flow-reference-checker.service';

@Injectable()
export class FlowReferenceChecksService implements OnModuleInit {
  private checkers: readonly FlowReferenceChecker[] = [];

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    this.checkers = this.discovery
      .getProviders()
      .filter((wrapper) => wrapper.token === FLOW_REFERENCE_CHECKER)
      .map((wrapper): unknown => wrapper.instance)
      .filter((instance) => instance instanceof FlowReferenceChecker);
  }

  async check(workspaceId: string, flow: FlowDocument): Promise<FlowIssue[]> {
    const found = await Promise.all(
      this.checkers.map((checker) => checker.check(workspaceId, flow)),
    );
    return found.flat();
  }
}
