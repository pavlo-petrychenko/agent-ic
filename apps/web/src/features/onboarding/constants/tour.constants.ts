export enum TourStatus {
  New = 'new',
  Active = 'active',
  Dismissed = 'dismissed',
  Completed = 'completed',
}

export enum TourStepId {
  Agents = 'agents',
  Prompts = 'prompts',
  Knowledge = 'knowledge',
  Channels = 'channels',
  Inbox = 'inbox',
  Testing = 'testing',
  Build = 'build',
  Canvas = 'canvas',
  Palette = 'palette',
  Guides = 'guides',
  Publish = 'publish',
  Test = 'test',
  Done = 'done',
}

export enum TourStepGroup {
  Explore = 'explore',
  Build = 'build',
  Publish = 'publish',
  Test = 'test',
}

export enum TourPage {
  Anywhere = 'anywhere',
  Agents = 'agents',
  Builder = 'builder',
  Testing = 'testing',
}

export enum TourStepAction {
  Next = 'next',
  GoThere = 'goThere',
  OpenTemplates = 'openTemplates',
  Finish = 'finish',
}

export enum TourStepState {
  Done = 'done',
  Skipped = 'skipped',
  Todo = 'todo',
}

export enum TourLink {
  Telegram = 'telegram',
  Team = 'team',
  Templates = 'templates',
  Guides = 'guides',
}
