import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { SimulatorTestsReader } from '@/modules/agents/services/simulator-tests-reader.service';

@Injectable()
export class SimulatorTestsService implements OnModuleInit {
  private reader: SimulatorTestsReader | null = null;

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    const found: unknown = this.discovery
      .getProviders()
      .find((wrapper) => wrapper.token === SimulatorTestsReader)?.instance;
    this.reader = found instanceof SimulatorTestsReader ? found : null;
  }

  async lastTestedAt(
    workspaceId: string,
    agentId: string,
    draftRevision: number,
  ): Promise<Date | null> {
    return (await this.reader?.lastTestedAt(workspaceId, agentId, draftRevision)) ?? null;
  }
}
