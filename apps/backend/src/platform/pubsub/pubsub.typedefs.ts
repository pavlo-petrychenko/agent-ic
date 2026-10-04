export type TopicEventValue = string | number | boolean | null;

export type TopicEvent = Readonly<Record<string, TopicEventValue>>;
