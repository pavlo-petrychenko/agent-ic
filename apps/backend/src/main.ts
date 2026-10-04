import { ApplicationLauncher } from '@/entrypoints/application.launcher';

await new ApplicationLauncher(process.argv).launch();
