export const TESTING_AGENTS_PAGE_SIZE = 100;

export const DRAFT_VERSION_OPTION = 'draft';

export const AGENTS_PATH = '/w/$workspaceId/agents';
export const BUILDER_PATH = '/w/$workspaceId/agents/$agentId';
export const TESTING_PATH = '/w/$workspaceId/testing';
export const VERSIONS_PATH = '/w/$workspaceId/testing/versions';

export enum TestingTab {
  Simulator = 'simulator',
  Versions = 'versions',
}
