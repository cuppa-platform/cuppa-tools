export type Platform = 'ios' | 'android' | 'web';

export interface CuppaConfig {
  name: string;
  version: string;
  platforms: Platform[];
  specs?: {
    repository?: string;
    branch?: string;
    local?: string;
  };
  generation?: {
    models?: GenerationConfig;
    api?: GenerationConfig;
    theme?: GenerationConfig;
  };
  plugins?: PluginConfig[];
}

export interface GenerationConfig {
  enabled: boolean;
  source?: string;
  output?: Record<Platform, string>;
}

export interface PluginConfig {
  name: string;
  version: string;
  config?: Record<string, any>;
}

export interface InitOptions {
  platforms?: string;
  template?: string;
  specsRepo?: string;
  noGit?: boolean;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
}

export interface CreateOptions extends InitOptions {
  features?: string;
  plugins?: string;
  apiSpec?: string;
  noExamples?: boolean;
}

export interface GenerateOptions {
  from?: string;
  platform?: string;
  output?: string;
  overwrite?: boolean;
  dryRun?: boolean;
}
