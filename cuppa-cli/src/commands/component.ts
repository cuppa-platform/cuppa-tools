import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { logger } from '../utils/logger';
import { readJsonFile, writeFile, ensureDir } from '../utils/file-system';
import { Platform } from '../types';
import { ComponentSpec, ComponentSpecParser } from '../generators/component-types';
import { SwiftComponentGenerator } from '../generators/swift-component-generator';

interface ComponentOptions {
  from?: string;
  platform?: string;
  output?: string;
  category?: string;
}

export const componentCommand = new Command('component')
  .description('Generate UI component from specification')
  .argument('[name]', 'Component name (optional if using --from)')
  .option('--from <path>', 'Component specification file (JSON)')
  .option('--platform <platform>', 'Target platform (ios, android, web)', 'ios')
  .option('--output <path>', 'Output directory')
  .option('--category <category>', 'Component category (buttons, forms, lists, etc.)')
  .action(async (name: string | undefined, options: ComponentOptions) => {
    try {
      await generateComponent(name, options);
    } catch (error) {
      logger.error(`Component generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

async function generateComponent(name: string | undefined, options: ComponentOptions) {
  const spinner = logger.startSpinner('Generating component...');

  try {
    const platform = (options.platform || 'ios') as Platform;
    let spec: ComponentSpec;
    let sourceFile: string;

    // Load component spec
    if (options.from) {
      sourceFile = path.resolve(process.cwd(), options.from);
      if (!await fs.pathExists(sourceFile)) {
        throw new Error(`Component specification file not found: ${sourceFile}`);
      }
      spec = await readJsonFile<ComponentSpec>(sourceFile);
    } else if (name) {
      // Create a basic spec from name
      spec = createBasicComponentSpec(name, options.category || 'components');
      sourceFile = 'inline';
    } else {
      throw new Error('Either provide a component name or use --from option');
    }

    // Parse spec
    const parser = new ComponentSpecParser();
    const parsedComponent = parser.parse(spec);

    logger.log(`\nGenerating component: ${parsedComponent.name}`);
    logger.log(`  Category: ${parsedComponent.category}`);
    logger.log(`  Platform: ${platform}`);
    logger.log('');

    // Determine output directory
    const outputDir = options.output
      ? path.resolve(process.cwd(), options.output)
      : getDefaultOutputPath(platform, parsedComponent.category);

    await ensureDir(outputDir);

    // Generate component based on platform
    let componentCode: string;

    switch (platform) {
      case 'ios':
        const swiftGen = new SwiftComponentGenerator();
        componentCode = swiftGen.generate(parsedComponent, path.basename(sourceFile));
        break;
      default:
        throw new Error(`Platform ${platform} not yet supported for component generation`);
    }

    // Write file
    const fileName = `${parsedComponent.name}.swift`;
    const filePath = path.join(outputDir, fileName);
    await writeFile(filePath, componentCode);

    logger.stopSpinner(true, `Component generated: ${parsedComponent.name}`);
    logger.log('');
    logger.success(`File created: ${filePath}`);
    logger.log('');
    logger.info('Next steps:');
    logger.log('  1. Review the generated component');
    logger.log('  2. Add it to your Xcode project or Package.swift');
    logger.log('  3. Use it in your SwiftUI views');
    logger.log('');

  } catch (error) {
    logger.stopSpinner(false, 'Failed');
    throw error;
  }
}

function createBasicComponentSpec(name: string, category: string): ComponentSpec {
  // Create a basic button-like component
  return {
    component: name,
    category,
    description: `${name} component`,
    properties: [
      {
        name: 'title',
        type: 'String',
        required: true,
        description: 'Button text',
      },
      {
        name: 'isLoading',
        type: 'Bool',
        required: false,
        defaultValue: false,
        description: 'Loading state',
      },
    ],
    style: {
      backgroundColor: 'blue',
      foregroundColor: 'white',
      cornerRadius: 12,
      padding: 16,
      font: 'body',
      fontWeight: 'semibold',
      maxWidth: 'infinity',
      minHeight: 44,
    },
    states: {
      loading: {
        showSpinner: true,
        disableInteraction: true,
      },
    },
    actions: [
      {
        name: 'action',
        type: 'async',
        parameters: [],
      },
    ],
  };
}

function getDefaultOutputPath(platform: Platform, category: string): string {
  const baseDir = process.cwd();

  switch (platform) {
    case 'ios':
      // Check if we're in cuppa-ios-v2 directory
      if (baseDir.includes('cuppa-ios-v2')) {
        return path.join(baseDir, 'Sources', 'CuppaUI', 'Generated', capitalize(category));
      }
      // Default to relative path
      return path.join(baseDir, 'iOS', 'Sources', 'CuppaUI', 'Generated', capitalize(category));
    case 'android':
      return path.join(baseDir, 'Android', 'src', 'main', 'kotlin', 'ui', 'components', category);
    case 'web':
      return path.join(baseDir, 'Web', 'src', 'components', category);
    default:
      return path.join(baseDir, 'generated', 'components', category);
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
