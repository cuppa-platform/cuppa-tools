import { ParsedPlugin } from './plugin-types';

export class SwiftPluginGenerator {
  generatePlugin(plugin: ParsedPlugin): Map<string, string> {
    const files = new Map<string, string>();

    // Generate main plugin file
    files.set(`${plugin.name}.swift`, this.generatePluginFile(plugin));

    // Generate configuration file
    files.set(`${plugin.name}Configuration.swift`, this.generateConfigFile(plugin));

    // Generate manager file
    files.set(`${plugin.managerName}.swift`, this.generateManagerFile(plugin));

    // Generate protocol file if providers exist
    if (plugin.protocolName && plugin.providers.length > 0) {
      files.set(`${plugin.protocolName}.swift`, this.generateProtocolFile(plugin));
    }

    // Generate model files
    plugin.models.forEach(model => {
      files.set(`${model.name}.swift`, this.generateModelFile(model, plugin));
    });

    // Generate provider template files
    plugin.providers.forEach(provider => {
      files.set(`${provider.name}.swift`, this.generateProviderFile(provider, plugin));
    });

    // Generate README
    files.set('README.md', this.generateReadme(plugin));

    return files;
  }

  private generatePluginFile(plugin: ParsedPlugin): string {
    const lines: string[] = [];

    // Header
    lines.push(this.createHeader(plugin.name));
    lines.push('import Foundation');
    lines.push('import CuppaCore');
    lines.push('');

    // Plugin class documentation
    lines.push('/// Plugin for integrating ' + plugin.description);
    lines.push('@MainActor');
    lines.push(`public final class ${plugin.name}: CuppaPlugin {`);
    lines.push(`    public let identifier = "${plugin.identifier}"`);
    lines.push(`    public let version = "${plugin.version}"`);
    lines.push(`    public let dependencies: [String] = ${this.formatArray(plugin.dependencies)}`);
    lines.push('');
    lines.push(`    private var config: ${plugin.name}Configuration?`);
    lines.push('');
    lines.push('    public init() {}');
    lines.push('');

    // Initialize method
    lines.push('    public func initialize(with config: PluginConfiguration) async throws {');
    lines.push(`        guard let pluginConfig = config as? ${plugin.name}Configuration else {`);
    lines.push('            throw PluginError.invalidConfiguration(');
    lines.push(`                reason: "Expected ${plugin.name}Configuration, got \\(type(of: config))"`);
    lines.push('            )');
    lines.push('        }');
    lines.push('');
    lines.push('        self.config = pluginConfig');
    lines.push('');

    // Register with manager if provider exists
    if (plugin.protocolName) {
      lines.push(`        // Register provider with ${plugin.managerName}`);
      lines.push(`        ${plugin.managerName}.shared.register(`);
      lines.push('            pluginConfig.provider,');
      lines.push('            enableDebugLogging: pluginConfig.enableDebugLogging');
      lines.push('        )');
      lines.push('');
    }

    lines.push('        if pluginConfig.enableDebugLogging {');
    lines.push(`            print("🔌 ${plugin.name} initialized")`);
    plugin.configuration.properties.forEach(prop => {
      if (prop.name !== 'enableDebugLogging') {
        lines.push(`            print("   - ${prop.name}: \\(pluginConfig.${prop.name})")`);
      }
    });
    lines.push('        }');
    lines.push('');
    lines.push(`        print("✅ ${plugin.name} initialized")`);
    lines.push('    }');
    lines.push('');

    // Register method
    lines.push('    nonisolated public func register(with container: ServiceContainer) {');
    lines.push(`        // Register ${plugin.managerName.toLowerCase()} as a service`);
    lines.push(`        container.register(${plugin.managerName}.self) { _ in`);
    lines.push(`            ${plugin.managerName}.shared`);
    lines.push('        }');
    lines.push('    }');
    lines.push('');

    // Teardown method
    lines.push('    public func teardown() async {');
    lines.push('        config = nil');
    lines.push(`        print("🗑️ ${plugin.name} torn down")`);
    lines.push('    }');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  private generateConfigFile(plugin: ParsedPlugin): string {
    const lines: string[] = [];

    lines.push(this.createHeader(`${plugin.name}Configuration`));
    lines.push('import Foundation');
    lines.push('import CuppaCore');
    lines.push('');

    lines.push(`/// Configuration for ${plugin.name}.`);
    lines.push(`public struct ${plugin.name}Configuration: PluginConfiguration {`);

    // Properties
    plugin.configuration.properties.forEach(prop => {
      if (prop.description) {
        lines.push(`    /// ${prop.description}`);
      }
      lines.push(`    public let ${prop.name}: ${this.mapType(prop.type)}`);
      lines.push('');
    });

    // Add provider if protocol exists
    if (plugin.protocolName) {
      lines.push(`    /// ${plugin.protocolName} implementation`);
      lines.push(`    public let provider: ${plugin.protocolName}`);
      lines.push('');
    }

    // Settings dictionary
    lines.push('    /// Required settings dictionary for PluginConfiguration conformance');
    lines.push('    public var settings: [String: Any] {');
    lines.push('        [');
    plugin.configuration.properties.forEach(prop => {
      lines.push(`            "${prop.name}": ${prop.name},`);
    });
    lines.push('        ]');
    lines.push('    }');
    lines.push('');

    // Initializer
    lines.push('    public init(');
    const initParams: string[] = [];
    if (plugin.protocolName) {
      initParams.push(`        provider: ${plugin.protocolName}`);
    }
    plugin.configuration.properties.forEach(prop => {
      const defaultVal = prop.defaultValue !== undefined
        ? ` = ${this.formatValue(prop.defaultValue, prop.type)}`
        : '';
      initParams.push(`        ${prop.name}: ${this.mapType(prop.type)}${defaultVal}`);
    });
    lines.push(initParams.join(',\n'));
    lines.push('    ) {');
    if (plugin.protocolName) {
      lines.push('        self.provider = provider');
    }
    plugin.configuration.properties.forEach(prop => {
      lines.push(`        self.${prop.name} = ${prop.name}`);
    });
    lines.push('    }');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  private generateManagerFile(plugin: ParsedPlugin): string {
    const lines: string[] = [];

    lines.push(this.createHeader(plugin.managerName));
    lines.push('import Foundation');
    lines.push('');

    lines.push(`/// Manager for coordinating ${plugin.description}`);
    lines.push('@MainActor');
    lines.push(`public final class ${plugin.managerName}: ObservableObject {`);
    lines.push(`    public static let shared = ${plugin.managerName}()`);
    lines.push('');

    if (plugin.protocolName) {
      lines.push(`    private var provider: ${plugin.protocolName}?`);
    }
    lines.push('    private var enableDebugLogging = false');
    lines.push('');
    lines.push('    private init() {}');
    lines.push('');

    if (plugin.protocolName) {
      lines.push(`    /// Register a ${plugin.protocolName.toLowerCase()}`);
      lines.push(`    public func register(_ provider: ${plugin.protocolName}, enableDebugLogging: Bool = false) {`);
      lines.push('        self.provider = provider');
      lines.push('        self.enableDebugLogging = enableDebugLogging');
      lines.push('    }');
      lines.push('');
    }

    // Generate methods
    plugin.methods.forEach(method => {
      lines.push(this.generateMethod(method, plugin));
      lines.push('');
    });

    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  private generateProtocolFile(plugin: ParsedPlugin): string {
    const lines: string[] = [];

    lines.push(this.createHeader(plugin.protocolName!));
    lines.push('import Foundation');
    lines.push('');

    lines.push(`/// Protocol for ${plugin.description.toLowerCase()} providers.`);
    lines.push(`public protocol ${plugin.protocolName}: Sendable {`);

    plugin.methods.forEach(method => {
      if (method.description) {
        lines.push(`    /// ${method.description}`);
      }
      const params = method.parameters.map(p => `${p.name}: ${this.mapType(p.type)}`).join(', ');
      const asyncKeyword = method.isAsync ? ' async' : '';
      const throwsKeyword = method.throws ? ' throws' : '';
      const returnType = method.returnType !== 'void' ? ` -> ${this.mapType(method.returnType)}` : '';
      lines.push(`    func ${method.name}(${params})${asyncKeyword}${throwsKeyword}${returnType}`);
      lines.push('');
    });

    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  private generateModelFile(model: any, plugin: ParsedPlugin): string {
    const lines: string[] = [];

    lines.push(this.createHeader(model.name));
    lines.push('import Foundation');
    lines.push('');

    if (model.description) {
      lines.push(`/// ${model.description}`);
    }
    lines.push(`public struct ${model.name}: Codable, Sendable {`);

    model.properties.forEach((prop: any) => {
      if (prop.description) {
        lines.push(`    /// ${prop.description}`);
      }
      const optional = prop.required ? '' : '?';
      lines.push(`    public let ${prop.name}: ${this.mapType(prop.type)}${optional}`);
      lines.push('');
    });

    // Initializer
    lines.push('    public init(');
    const params = model.properties.map((prop: any, idx: number) => {
      const optional = prop.required ? '' : '?';
      const defaultVal = !prop.required ? ' = nil' : '';
      const comma = idx === model.properties.length - 1 ? '' : ',';
      return `        ${prop.name}: ${this.mapType(prop.type)}${optional}${defaultVal}${comma}`;
    });
    lines.push(params.join('\n'));
    lines.push('    ) {');
    model.properties.forEach((prop: any) => {
      lines.push(`        self.${prop.name} = ${prop.name}`);
    });
    lines.push('    }');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  private generateProviderFile(provider: any, plugin: ParsedPlugin): string {
    const lines: string[] = [];

    lines.push(this.createHeader(provider.name));
    lines.push('import Foundation');
    lines.push('');

    if (provider.description) {
      lines.push(`/// ${provider.description}`);
    }
    lines.push(`public final class ${provider.name}: ${provider.protocol}, @unchecked Sendable {`);
    lines.push('    public init() {}');
    lines.push('');

    // Implement protocol methods
    plugin.methods.forEach(method => {
      if (method.description) {
        lines.push(`    /// ${method.description}`);
      }
      const params = method.parameters.map(p => `${p.name}: ${this.mapType(p.type)}`).join(', ');
      const asyncKeyword = method.isAsync ? ' async' : '';
      const throwsKeyword = method.throws ? ' throws' : '';
      const returnType = method.returnType !== 'void' ? ` -> ${this.mapType(method.returnType)}` : '';
      lines.push(`    public func ${method.name}(${params})${asyncKeyword}${throwsKeyword}${returnType} {`);
      lines.push('        // TODO: Implement this method');
      if (method.returnType !== 'void') {
        lines.push(`        fatalError("${method.name} not implemented")`);
      }
      lines.push('    }');
      lines.push('');
    });

    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  private generateMethod(method: any, plugin: ParsedPlugin): string {
    const lines: string[] = [];

    if (method.description) {
      lines.push(`    /// ${method.description}`);
    }

    const params = method.parameters.map((p: any) => `${p.name}: ${this.mapType(p.type)}`).join(', ');
    const asyncKeyword = method.isAsync ? ' async' : '';
    const throwsKeyword = method.throws ? ' throws' : '';
    const returnType = method.returnType !== 'void' ? ` -> ${this.mapType(method.returnType)}` : '';

    lines.push(`    public func ${method.name}(${params})${asyncKeyword}${throwsKeyword}${returnType} {`);

    if (plugin.protocolName) {
      lines.push('        guard let provider = provider else {');
      lines.push('            fatalError("No provider registered")');
      lines.push('        }');
      lines.push('');
      const callParams = method.parameters.map((p: any) => `${p.name}: ${p.name}`).join(', ');
      const awaitKeyword = method.isAsync ? 'await ' : '';
      const tryKeyword = method.throws ? 'try ' : '';
      const returnKeyword = method.returnType !== 'void' ? 'return ' : '';
      lines.push(`        ${returnKeyword}${tryKeyword}${awaitKeyword}provider.${method.name}(${callParams})`);
    } else {
      lines.push('        // TODO: Implement this method');
    }

    lines.push('    }');

    return lines.join('\n');
  }

  private generateReadme(plugin: ParsedPlugin): string {
    const lines: string[] = [];

    lines.push(`# ${plugin.name}`);
    lines.push('');
    lines.push(plugin.description);
    lines.push('');
    lines.push('## Installation');
    lines.push('');
    lines.push('```swift');
    lines.push('// Add to your Package.swift dependencies');
    lines.push(`.package(url: "...", from: "${plugin.version}")`);
    lines.push('```');
    lines.push('');
    lines.push('## Usage');
    lines.push('');
    lines.push('```swift');
    lines.push('import CuppaCore');
    lines.push(`import ${plugin.name}`);
    lines.push('');
    lines.push('// Configure the plugin');
    lines.push(`let config = ${plugin.name}Configuration(`);
    if (plugin.protocolName) {
      lines.push(`    provider: Your${plugin.protocolName}(),`);
    }
    lines.push('    enableDebugLogging: true');
    lines.push(')');
    lines.push('');
    lines.push('// Register with PluginManager');
    lines.push(`let plugin = ${plugin.name}()`);
    lines.push('try await PluginManager.shared.register(plugin, config: config)');
    lines.push('```');
    lines.push('');
    lines.push('## License');
    lines.push('');
    lines.push('Copyright © 2025 ' + plugin.author);
    lines.push('');

    return lines.join('\n');
  }

  private createHeader(fileName: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return [
      '//',
      `//  ${fileName}.swift`,
      '//',
      `//  Generated by cuppa-cli on ${timestamp}`,
      '//  Copyright © 2025 MyCuppa. All rights reserved.',
      '//',
      '',
    ].join('\n');
  }

  private mapType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': 'Double',
      'integer': 'Int',
      'boolean': 'Bool',
      'void': 'Void',
      'any': 'Any',
    };

    return typeMap[type.toLowerCase()] || type;
  }

  private formatValue(value: any, type: string): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  }

  private formatArray(items: string[]): string {
    if (items.length === 0) {
      return '[]';
    }
    return `["${items.join('", "')}"]`;
  }
}
