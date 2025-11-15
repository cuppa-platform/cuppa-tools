// Plugin Specification Types

export interface PluginSpec {
  name: string;
  identifier: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  configuration?: PluginConfigSpec;
  methods?: PluginMethod[];
  models?: PluginModel[];
  providers?: PluginProvider[];
}

export interface PluginConfigSpec {
  properties: PluginConfigProperty[];
}

export interface PluginConfigProperty {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
}

export interface PluginMethod {
  name: string;
  description?: string;
  parameters: PluginMethodParameter[];
  returnType: string;
  isAsync: boolean;
  throws: boolean;
}

export interface PluginMethodParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

export interface PluginModel {
  name: string;
  description?: string;
  properties: PluginModelProperty[];
}

export interface PluginModelProperty {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

export interface PluginProvider {
  name: string;
  description?: string;
  protocol?: string;
}

// Parsed Plugin (normalized for generation)
export interface ParsedPlugin {
  name: string;
  identifier: string;
  version: string;
  description: string;
  author: string;
  dependencies: string[];
  configuration: ParsedPluginConfig;
  methods: ParsedPluginMethod[];
  models: ParsedPluginModel[];
  providers: ParsedPluginProvider[];
  managerName: string;
  protocolName?: string;
}

export interface ParsedPluginConfig {
  properties: ParsedConfigProperty[];
}

export interface ParsedConfigProperty {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface ParsedPluginMethod {
  name: string;
  description: string;
  parameters: ParsedMethodParameter[];
  returnType: string;
  isAsync: boolean;
  throws: boolean;
}

export interface ParsedMethodParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

export interface ParsedPluginModel {
  name: string;
  description: string;
  properties: ParsedModelProperty[];
}

export interface ParsedModelProperty {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface ParsedPluginProvider {
  name: string;
  description: string;
  protocol: string;
}

// Plugin Parser
export class PluginSpecParser {
  parse(spec: PluginSpec): ParsedPlugin {
    const name = spec.name;
    const pluginName = `Cuppa${name}Plugin`;
    const managerName = `${name}Manager`;
    const protocolName = spec.providers && spec.providers.length > 0
      ? `${name}Provider`
      : undefined;

    return {
      name: pluginName,
      identifier: spec.identifier || `com.cuppa.${name.toLowerCase()}`,
      version: spec.version || '1.0.0',
      description: spec.description || `Plugin for ${name} functionality`,
      author: spec.author || 'MyCuppa Team',
      dependencies: spec.dependencies || [],
      configuration: this.parseConfig(spec.configuration, name),
      methods: this.parseMethods(spec.methods || []),
      models: this.parseModels(spec.models || []),
      providers: this.parseProviders(spec.providers || [], protocolName || ''),
      managerName,
      protocolName,
    };
  }

  private parseConfig(config: PluginConfigSpec | undefined, pluginName: string): ParsedPluginConfig {
    if (!config) {
      return {
        properties: [
          {
            name: 'enableDebugLogging',
            type: 'boolean',
            description: 'Whether to enable debug logging',
            required: false,
            defaultValue: false,
          },
        ],
      };
    }

    return {
      properties: config.properties.map(prop => ({
        name: prop.name,
        type: prop.type,
        description: prop.description || prop.name,
        required: prop.required,
        defaultValue: prop.defaultValue,
      })),
    };
  }

  private parseMethods(methods: PluginMethod[]): ParsedPluginMethod[] {
    return methods.map(method => ({
      name: method.name,
      description: method.description || method.name,
      parameters: method.parameters.map(param => ({
        name: param.name,
        type: param.type,
        required: param.required,
        defaultValue: param.defaultValue,
      })),
      returnType: method.returnType,
      isAsync: method.isAsync,
      throws: method.throws,
    }));
  }

  private parseModels(models: PluginModel[]): ParsedPluginModel[] {
    return models.map(model => ({
      name: model.name,
      description: model.description || model.name,
      properties: model.properties.map(prop => ({
        name: prop.name,
        type: prop.type,
        description: prop.description || prop.name,
        required: prop.required,
      })),
    }));
  }

  private parseProviders(providers: PluginProvider[], defaultProtocol: string): ParsedPluginProvider[] {
    return providers.map(provider => ({
      name: provider.name,
      description: provider.description || provider.name,
      protocol: provider.protocol || defaultProtocol,
    }));
  }
}
