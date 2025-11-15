import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { logger } from '../utils/logger';
import { readJsonFile, writeFile, ensureDir } from '../utils/file-system';
import { GenerateOptions, Platform, CuppaConfig } from '../types';
import { JSONSchemaParser, JSONSchema } from '../generators/json-schema-types';
import { SwiftModelGenerator } from '../generators/swift-model-generator';
import { KotlinModelGenerator } from '../generators/kotlin-model-generator';
import { TypeScriptModelGenerator } from '../generators/typescript-model-generator';
import { OpenAPIParser, OpenAPISpec } from '../generators/openapi-types';
import { SwiftAPIClientGenerator } from '../generators/swift-api-client-generator';
import { KotlinAPIClientGenerator } from '../generators/kotlin-api-client-generator';
import { TypeScriptAPIClientGenerator } from '../generators/typescript-api-client-generator';
import { DesignTokensParser, DesignTokens } from '../generators/design-tokens-types';
import { SwiftThemeGenerator } from '../generators/swift-theme-generator';
import { KotlinThemeGenerator } from '../generators/kotlin-theme-generator';
import { TypeScriptThemeGenerator } from '../generators/typescript-theme-generator';

export const generateCommand = new Command('generate')
  .description('Generate code from specifications')
  .argument('<type>', 'Type (model, api-client, theme)')
  .argument('[name]', 'Name of the item to generate')
  .option('--from <path>', 'Source specification file')
  .option('--platform <name>', 'Target platform (ios, android, web, all)')
  .option('--output <path>', 'Output directory')
  .option('--overwrite', 'Overwrite existing files')
  .option('--dry-run', 'Preview changes without writing')
  .action(async (type: string, name: string | undefined, options: GenerateOptions) => {
    try {
      switch (type) {
        case 'model':
          await generateModel(name, options);
          break;
        case 'api-client':
          await generateAPIClient(options);
          break;
        case 'theme':
          await generateTheme(options);
          break;
        default:
          logger.error(`Unknown generator type: ${type}`);
          logger.info('Available types: model, api-client, theme');
          process.exit(1);
      }
    } catch (error) {
      logger.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

async function generateModel(name: string | undefined, options: GenerateOptions) {
  const spinner = logger.startSpinner('Generating models...');

  try {
    // Load cuppa.config.json
    const configPath = path.join(process.cwd(), 'cuppa.config.json');
    if (!await fs.pathExists(configPath)) {
      throw new Error('cuppa.config.json not found. Run `cuppa init` first.');
    }

    const config = await readJsonFile<CuppaConfig>(configPath);

    // Determine source file
    let sourceFile: string;
    if (options.from) {
      sourceFile = path.resolve(process.cwd(), options.from);
    } else if (config.generation?.models?.source) {
      sourceFile = path.resolve(process.cwd(), config.generation.models.source);
    } else {
      throw new Error('No source file specified. Use --from option or configure generation.models.source in cuppa.config.json');
    }

    // Check if source is a directory or file
    const stats = await fs.stat(sourceFile);
    let schemaFiles: string[] = [];

    if (stats.isDirectory()) {
      // If directory, find all .json files
      const files = await fs.readdir(sourceFile);
      schemaFiles = files
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(sourceFile, f));

      if (name) {
        // Filter by name if provided
        schemaFiles = schemaFiles.filter(f =>
          path.basename(f, '.json').toLowerCase() === name.toLowerCase()
        );
      }
    } else {
      // Single file
      schemaFiles = [sourceFile];
    }

    if (schemaFiles.length === 0) {
      throw new Error(`No JSON schema files found in ${sourceFile}`);
    }

    // Determine platforms
    const platforms = determinePlatforms(options.platform, config);

    // Initialize generators
    const swiftGen = new SwiftModelGenerator();
    const kotlinGen = new KotlinModelGenerator();
    const tsGen = new TypeScriptModelGenerator();
    const parser = new JSONSchemaParser();

    let generatedCount = 0;

    // Process each schema file
    for (const schemaFile of schemaFiles) {
      const schema = await readJsonFile<JSONSchema>(schemaFile);
      const parsedModel = parser.parse(schema);

      logger.log(`\nGenerating ${parsedModel.name}...`);

      // Generate for each platform
      for (const platform of platforms) {
        const outputDir = determineOutputDir(platform, options.output, config);
        await ensureDir(outputDir);

        let generator: SwiftModelGenerator | KotlinModelGenerator | TypeScriptModelGenerator;
        let extension: string;
        let fileName: string;

        switch (platform) {
          case 'ios':
            generator = swiftGen;
            extension = 'swift';
            fileName = `${parsedModel.name}.swift`;
            break;
          case 'android':
            generator = kotlinGen;
            extension = 'kt';
            fileName = `${parsedModel.name}.kt`;
            break;
          case 'web':
            generator = tsGen;
            extension = 'ts';
            fileName = `${parsedModel.name}.ts`;
            break;
          default:
            logger.warn(`Skipping unsupported platform: ${platform}`);
            continue;
        }

        const code = generator.generate(parsedModel, path.basename(schemaFile));
        const outputPath = path.join(outputDir, fileName);

        // Check if file exists
        if (await fs.pathExists(outputPath) && !options.overwrite) {
          logger.warn(`  ${platform}: ${fileName} already exists (use --overwrite to replace)`);
          continue;
        }

        if (options.dryRun) {
          logger.info(`  ${platform}: Would write ${fileName}`);
          logger.log(`\n${code}\n`);
        } else {
          await writeFile(outputPath, code);
          logger.success(`  ${platform}: ${outputPath}`);
          generatedCount++;
        }
      }
    }

    logger.stopSpinner(
      true,
      options.dryRun
        ? `Preview complete for ${schemaFiles.length} model(s)`
        : `Generated ${generatedCount} file(s) from ${schemaFiles.length} model(s)`
    );
  } catch (error) {
    logger.stopSpinner(false, 'Failed');
    throw error;
  }
}

function determinePlatforms(requestedPlatform: string | undefined, config: CuppaConfig): Platform[] {
  if (requestedPlatform) {
    if (requestedPlatform === 'all') {
      return config.platforms || [];
    }
    return [requestedPlatform as Platform];
  }

  return config.platforms || [];
}

function determineOutputDir(platform: Platform, requestedOutput: string | undefined, config: CuppaConfig): string {
  if (requestedOutput) {
    return path.resolve(process.cwd(), requestedOutput);
  }

  // Default output directories based on platform
  const baseDir = process.cwd();

  switch (platform) {
    case 'ios':
      return path.join(baseDir, 'iOS', 'Sources', 'Models');
    case 'android':
      return path.join(baseDir, 'Android', 'src', 'main', 'kotlin', 'models');
    case 'web':
      return path.join(baseDir, 'Web', 'src', 'models');
    default:
      return path.join(baseDir, 'generated', platform);
  }
}

async function generateAPIClient(options: GenerateOptions) {
  const spinner = logger.startSpinner('Generating API client...');

  try {
    // Load cuppa.config.json
    const configPath = path.join(process.cwd(), 'cuppa.config.json');
    if (!await fs.pathExists(configPath)) {
      throw new Error('cuppa.config.json not found. Run `cuppa init` first.');
    }

    const config = await readJsonFile<CuppaConfig>(configPath);

    // Determine source file
    let sourceFile: string;
    if (options.from) {
      sourceFile = path.resolve(process.cwd(), options.from);
    } else if (config.generation?.api?.source) {
      sourceFile = path.resolve(process.cwd(), config.generation.api.source);
    } else {
      throw new Error('No source file specified. Use --from option or configure generation.api.source in cuppa.config.json');
    }

    if (!await fs.pathExists(sourceFile)) {
      throw new Error(`OpenAPI spec file not found: ${sourceFile}`);
    }

    // Read OpenAPI spec (supports both JSON and YAML)
    let spec: OpenAPISpec;
    const content = await fs.readFile(sourceFile, 'utf8');

    if (sourceFile.endsWith('.yaml') || sourceFile.endsWith('.yml')) {
      spec = yaml.load(content) as OpenAPISpec;
    } else {
      spec = JSON.parse(content);
    }

    // Parse OpenAPI spec
    const parser = new OpenAPIParser();
    const parsedAPI = parser.parse(spec);

    logger.log(`\nGenerating API client for ${parsedAPI.name} v${parsedAPI.version}...`);

    // Determine platforms
    const platforms = determinePlatforms(options.platform, config);

    // Initialize generators
    const swiftGen = new SwiftAPIClientGenerator();
    const kotlinGen = new KotlinAPIClientGenerator();
    const tsGen = new TypeScriptAPIClientGenerator();

    let generatedCount = 0;

    // Generate for each platform
    for (const platform of platforms) {
      const outputDir = determineAPIOutputDir(platform, options.output, config);
      await ensureDir(outputDir);

      let generator: SwiftAPIClientGenerator | KotlinAPIClientGenerator | TypeScriptAPIClientGenerator;
      let fileName: string;

      switch (platform) {
        case 'ios':
          generator = swiftGen;
          fileName = `${parsedAPI.name}APIClient.swift`;
          break;
        case 'android':
          generator = kotlinGen;
          fileName = `${parsedAPI.name}APIClient.kt`;
          break;
        case 'web':
          generator = tsGen;
          fileName = `${parsedAPI.name}APIClient.ts`;
          break;
        default:
          logger.warn(`Skipping unsupported platform: ${platform}`);
          continue;
      }

      const code = generator.generate(parsedAPI, path.basename(sourceFile));
      const outputPath = path.join(outputDir, fileName);

      // Check if file exists
      if (await fs.pathExists(outputPath) && !options.overwrite) {
        logger.warn(`  ${platform}: ${fileName} already exists (use --overwrite to replace)`);
        continue;
      }

      if (options.dryRun) {
        logger.info(`  ${platform}: Would write ${fileName}`);
        logger.log(`\n${code.substring(0, 500)}...\n`);
      } else {
        await writeFile(outputPath, code);
        logger.success(`  ${platform}: ${outputPath}`);
        generatedCount++;
      }
    }

    logger.stopSpinner(
      true,
      options.dryRun
        ? `Preview complete for ${parsedAPI.name} API client`
        : `Generated ${generatedCount} API client file(s)`
    );
  } catch (error) {
    logger.stopSpinner(false, 'Failed');
    throw error;
  }
}

function determineAPIOutputDir(platform: Platform, requestedOutput: string | undefined, config: CuppaConfig): string {
  if (requestedOutput) {
    return path.resolve(process.cwd(), requestedOutput);
  }

  // Default output directories based on platform
  const baseDir = process.cwd();

  switch (platform) {
    case 'ios':
      return path.join(baseDir, 'iOS', 'Sources', 'API');
    case 'android':
      return path.join(baseDir, 'Android', 'src', 'main', 'kotlin', 'api');
    case 'web':
      return path.join(baseDir, 'Web', 'src', 'api');
    default:
      return path.join(baseDir, 'generated', platform, 'api');
  }
}

async function generateTheme(options: GenerateOptions) {
  const spinner = logger.startSpinner('Generating theme...');

  try {
    // Load cuppa.config.json
    const configPath = path.join(process.cwd(), 'cuppa.config.json');
    if (!await fs.pathExists(configPath)) {
      throw new Error('cuppa.config.json not found. Run `cuppa init` first.');
    }

    const config = await readJsonFile<CuppaConfig>(configPath);

    // Determine source file
    let sourceFile: string;
    if (options.from) {
      sourceFile = path.resolve(process.cwd(), options.from);
    } else if (config.generation?.theme?.source) {
      sourceFile = path.resolve(process.cwd(), config.generation.theme.source);
    } else {
      throw new Error('No source file specified. Use --from option or configure generation.theme.source in cuppa.config.json');
    }

    if (!await fs.pathExists(sourceFile)) {
      throw new Error(`Design tokens file not found: ${sourceFile}`);
    }

    // Read design tokens
    const tokens = await readJsonFile<DesignTokens>(sourceFile);

    // Parse design tokens
    const parser = new DesignTokensParser();
    const themeName = config.name
      ? config.name.charAt(0).toUpperCase() + config.name.slice(1)
      : 'AppTheme';
    const parsedTheme = parser.parse(tokens, themeName);

    logger.log(`\nGenerating theme ${parsedTheme.name}...`);

    // Determine platforms
    const platforms = determinePlatforms(options.platform, config);

    // Initialize generators
    const swiftGen = new SwiftThemeGenerator();
    const kotlinGen = new KotlinThemeGenerator();
    const tsGen = new TypeScriptThemeGenerator();

    let generatedCount = 0;

    // Generate for each platform
    for (const platform of platforms) {
      const outputDir = determineThemeOutputDir(platform, options.output, config);
      await ensureDir(outputDir);

      let generator: SwiftThemeGenerator | KotlinThemeGenerator | TypeScriptThemeGenerator;
      let fileName: string;

      switch (platform) {
        case 'ios':
          generator = swiftGen;
          fileName = `${parsedTheme.name}.swift`;
          break;
        case 'android':
          generator = kotlinGen;
          fileName = `${parsedTheme.name}.kt`;
          break;
        case 'web':
          generator = tsGen;
          fileName = `${parsedTheme.name.toLowerCase()}.ts`;
          break;
        default:
          logger.warn(`Skipping unsupported platform: ${platform}`);
          continue;
      }

      const code = generator.generate(parsedTheme, path.basename(sourceFile));
      const outputPath = path.join(outputDir, fileName);

      // Check if file exists
      if (await fs.pathExists(outputPath) && !options.overwrite) {
        logger.warn(`  ${platform}: ${fileName} already exists (use --overwrite to replace)`);
        continue;
      }

      if (options.dryRun) {
        logger.info(`  ${platform}: Would write ${fileName}`);
        logger.log(`\n${code.substring(0, 500)}...\n`);
      } else {
        await writeFile(outputPath, code);
        logger.success(`  ${platform}: ${outputPath}`);
        generatedCount++;
      }
    }

    logger.stopSpinner(
      true,
      options.dryRun
        ? `Preview complete for ${parsedTheme.name} theme`
        : `Generated ${generatedCount} theme file(s)`
    );
  } catch (error) {
    logger.stopSpinner(false, 'Failed');
    throw error;
  }
}

function determineThemeOutputDir(platform: Platform, requestedOutput: string | undefined, config: CuppaConfig): string {
  if (requestedOutput) {
    return path.resolve(process.cwd(), requestedOutput);
  }

  // Default output directories based on platform
  const baseDir = process.cwd();

  switch (platform) {
    case 'ios':
      return path.join(baseDir, 'iOS', 'Sources', 'Theme');
    case 'android':
      return path.join(baseDir, 'Android', 'src', 'main', 'kotlin', 'theme');
    case 'web':
      return path.join(baseDir, 'Web', 'src', 'theme');
    default:
      return path.join(baseDir, 'generated', platform, 'theme');
  }
}
