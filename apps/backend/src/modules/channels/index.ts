export { ChannelsModule } from '@/modules/channels/channels.module';
export { ChannelAdapterNotFoundError } from '@/modules/channels/errors/channel-adapter-not-found.error';
export { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
export { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
export { ChannelAdapterRegistryService } from '@/modules/channels/services/channel-adapter-registry.service';
export type { ChannelOutboundMessage } from '@/modules/channels/typedefs/channel-message.typedefs';
