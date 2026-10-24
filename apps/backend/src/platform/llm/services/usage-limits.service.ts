export abstract class UsageLimits {
  abstract assertPlatformCallAllowed(workspaceId: string): Promise<void>;
}
