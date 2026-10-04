import { join } from 'node:path';
import { MODULE_SDL_GLOB } from '@/platform/graphql-server/constants/module-sdl.constants';

export const moduleTypePaths = (): string[] => [join(import.meta.dirname, MODULE_SDL_GLOB)];
