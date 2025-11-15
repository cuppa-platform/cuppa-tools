import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { logger } from '../utils/logger';
import { writeFile, ensureDir } from '../utils/file-system';
import { Platform } from '../types';
import { PluginSpec, PluginSpecParser } from '../generators/plugin-types';
import { SwiftPluginGenerator } from '../generators/swift-plugin-generator';

interface PluginOptions {
  platform?: string;
  output?: string;
  template?: string;
}

export const pluginCommand = new Command('plugin')
  .description('Generate plugin scaffolding')
  .argument('<name>', 'Name of the plugin (e.g., "Payment", "Push", "Location")')
  .option('--platform <platform>', 'Target platform (ios, android, web)', 'ios')
  .option('--output <path>', 'Output directory')
  .option('--template <type>', 'Plugin template type (basic, provider, service)', 'basic')
  .action(async (name: string, options: PluginOptions) => {
    try {
      await generatePlugin(name, options);
    } catch (error) {
      logger.error(`Plugin generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

async function generatePlugin(name: string, options: PluginOptions) {
  const spinner = logger.startSpinner(`Generating ${name} plugin...`);

  try {
    const platform = (options.platform || 'ios') as Platform;
    const template = options.template || 'basic';

    // Create plugin spec based on template
    const spec = createPluginSpec(name, template);

    // Parse spec
    const parser = new PluginSpecParser();
    const parsedPlugin = parser.parse(spec);

    logger.log(`\nGenerating plugin: ${parsedPlugin.name}`);
    logger.log(`  Platform: ${platform}`);
    logger.log(`  Template: ${template}`);
    logger.log('');

    // Determine output directory
    const outputDir = options.output
      ? path.resolve(process.cwd(), options.output)
      : path.join(process.cwd(), 'Plugins', platform === 'ios' ? 'iOS' : platform, parsedPlugin.name);

    await ensureDir(outputDir);

    // Generate files based on platform
    let files: Map<string, string>;

    switch (platform) {
      case 'ios':
        const swiftGen = new SwiftPluginGenerator();
        files = swiftGen.generatePlugin(parsedPlugin);
        break;
      default:
        throw new Error(`Platform ${platform} not yet supported for plugin generation`);
    }

    // Write files
    let fileCount = 0;
    for (const [fileName, content] of files) {
      const filePath = path.join(outputDir, fileName);
      await ensureDir(path.dirname(filePath));
      await writeFile(filePath, content);
      logger.success(`  ${fileName}`);
      fileCount++;
    }

    logger.stopSpinner(true, `Generated ${fileCount} files for ${parsedPlugin.name}`);
    logger.log('');
    logger.info(`Plugin created at: ${outputDir}`);
    logger.log('');
    logger.info('Next steps:');
    logger.log('  1. Implement the TODO methods in the generated files');
    logger.log('  2. Add tests for your plugin');
    logger.log('  3. Register the plugin in your app');
    logger.log('');

  } catch (error) {
    logger.stopSpinner(false, 'Failed');
    throw error;
  }
}

function createPluginSpec(name: string, template: string): PluginSpec {
  const baseSpec: PluginSpec = {
    name,
    identifier: `com.cuppa.${name.toLowerCase()}`,
    version: '1.0.0',
    description: `${name} functionality`,
    author: 'MyCuppa Team',
    dependencies: [],
  };

  switch (template) {
    case 'provider':
      return {
        ...baseSpec,
        configuration: {
          properties: [
            {
              name: 'enableDebugLogging',
              type: 'boolean',
              description: 'Whether to enable debug logging',
              required: false,
              defaultValue: false,
            },
          ],
        },
        methods: [
          {
            name: 'initialize',
            description: 'Initialize the service',
            parameters: [],
            returnType: 'void',
            isAsync: true,
            throws: true,
          },
          {
            name: 'performAction',
            description: 'Perform the main action',
            parameters: [
              {
                name: 'input',
                type: 'string',
                required: true,
              },
            ],
            returnType: 'string',
            isAsync: true,
            throws: true,
          },
        ],
        providers: [
          {
            name: `Console${name}Provider`,
            description: `Console-based ${name} provider for testing`,
          },
        ],
      };

    case 'service':
      return {
        ...baseSpec,
        methods: [
          {
            name: 'start',
            description: 'Start the service',
            parameters: [],
            returnType: 'void',
            isAsync: true,
            throws: false,
          },
          {
            name: 'stop',
            description: 'Stop the service',
            parameters: [],
            returnType: 'void',
            isAsync: true,
            throws: false,
          },
        ],
      };

    case 'basic':
    default:
      return baseSpec;
  }
}
