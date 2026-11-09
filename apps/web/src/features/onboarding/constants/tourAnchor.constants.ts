export enum TourAnchor {
  NavAgents = 'nav-agents',
  NavPrompts = 'nav-prompts',
  NavKnowledge = 'nav-knowledge',
  NavChannels = 'nav-channels',
  NavInbox = 'nav-inbox',
  NavTesting = 'nav-testing',
  NewAgent = 'agents-new',
  BuilderCanvas = 'builder-canvas',
  BuilderPalette = 'builder-palette',
  BuilderGuides = 'builder-guides',
  BuilderPublish = 'builder-publish',
  TestingSimulator = 'testing-simulator',
}

export const TOUR_ANCHOR_ATTRIBUTE = 'data-tour';

export const OPEN_DIALOG_SELECTOR = '[role="dialog"][data-state="open"]';

export const OBSERVED_ATTRIBUTES: string[] = [TOUR_ANCHOR_ATTRIBUTE, 'data-state'];
