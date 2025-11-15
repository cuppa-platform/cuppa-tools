import { Command } from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import { logger } from '../utils/logger';
import { ensureDir, writeJsonFile, getProjectRoot } from '../utils/file-system';
import { CuppaConfig, InitOptions, Platform } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const initCommand = new Command('init')
  .description('Initialize a new Cuppa project')
  .argument('[project-name]', 'Project name')
  .option('-p, --platforms <platforms>', 'Platforms to support (ios,android,web)')
  .option('-t, --template <template>', 'Template to use (default, minimal)', 'default')
  .option('--specs-repo <url>', 'Custom cuppa-specs repository URL')
  .option('--no-git', 'Skip git initialization')
  .option('--package-manager <pm>', 'Package manager (npm, yarn, pnpm)', 'npm')
  .action(async (projectName: string | undefined, options: InitOptions) => {
    try {
      await runInit(projectName, options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Unknown error occurred');
      process.exit(1);
    }
  });

async function runInit(
  projectName: string | undefined,
  options: InitOptions
): Promise<void> {
  // Prompt for missing information
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: projectName || 'my-cuppa-app',
      when: !projectName,
    },
    {
      type: 'checkbox',
      name: 'platforms',
      message: 'Select platforms:',
      choices: [
        { name: 'iOS', value: 'ios', checked: true },
        { name: 'Android', value: 'android' },
        { name: 'Web', value: 'web', checked: true },
      ],
      when: !options.platforms,
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select template:',
      choices: [
        { name: 'Default (Full-featured)', value: 'default' },
        { name: 'Minimal (Bare-bones)', value: 'minimal' },
      ],
      default: 'default',
      when: !options.template,
    },
  ]);

  const finalProjectName = projectName || answers.projectName;
  const finalPlatforms = options.platforms
    ? (options.platforms.split(',') as Platform[])
    : answers.platforms;
  const finalTemplate = options.template || answers.template;

  logger.log('');
  logger.info(`Creating Cuppa project: ${finalProjectName}`);
  logger.info(`Platforms: ${finalPlatforms.join(', ')}`);
  logger.info(`Template: ${finalTemplate}`);
  logger.log('');

  // Create project directory
  const projectRoot = path.join(getProjectRoot(), finalProjectName);
  logger.startSpinner('Creating project directory...');
  await ensureDir(projectRoot);
  logger.stopSpinner(true, 'Project directory created');

  // Create directory structure
  logger.startSpinner('Setting up project structure...');
  await createDirectoryStructure(projectRoot, finalPlatforms);
  logger.stopSpinner(true, 'Project structure created');

  // Create cuppa.config.json
  logger.startSpinner('Creating cuppa.config.json...');
  const config = createCuppaConfig(finalProjectName, finalPlatforms);
  await writeJsonFile(path.join(projectRoot, 'cuppa.config.json'), config);
  logger.stopSpinner(true, 'Configuration file created');

  // Initialize git repository
  if (options.noGit !== true) {
    logger.startSpinner('Initializing git repository...');
    try {
      await execAsync('git init', { cwd: projectRoot });
      await createGitignore(projectRoot);
      logger.stopSpinner(true, 'Git repository initialized');
    } catch (error) {
      logger.stopSpinner(false, 'Failed to initialize git');
    }
  }

  // Create README
  logger.startSpinner('Creating README.md...');
  await createReadme(projectRoot, finalProjectName, finalPlatforms);
  logger.stopSpinner(true, 'README created');

  // Success message
  logger.log('');
  logger.success(`Successfully created ${finalProjectName}!`);
  logger.log('');
  logger.info('Next steps:');
  logger.log(`  cd ${finalProjectName}`);
  logger.log('  cuppa generate model User --from cuppa-specs/models/User.schema.json');
  logger.log('  cuppa add plugin @cuppa/analytics');
  logger.log('');
}

async function createDirectoryStructure(
  projectRoot: string,
  platforms: Platform[]
): Promise<void> {
  const dirs = [
    'cuppa-specs/models',
    'cuppa-specs/api',
    'cuppa-specs/design',
    'cuppa-specs/architecture',
    'scripts',
  ];

  if (platforms.includes('ios')) {
    dirs.push('platforms/ios');
  }

  if (platforms.includes('android')) {
    dirs.push('platforms/android');
  }

  if (platforms.includes('web')) {
    dirs.push('platforms/web');
  }

  for (const dir of dirs) {
    await ensureDir(path.join(projectRoot, dir));
  }
}

function createCuppaConfig(
  projectName: string,
  platforms: Platform[]
): CuppaConfig {
  return {
    name: projectName,
    version: '1.0.0',
    platforms,
    specs: {
      local: './cuppa-specs',
    },
    generation: {
      models: {
        enabled: true,
        source: 'cuppa-specs/models',
      },
      api: {
        enabled: true,
        source: 'cuppa-specs/api/v1/openapi.yaml',
      },
      theme: {
        enabled: true,
        source: 'cuppa-specs/design/tokens.json',
      },
    },
    plugins: [],
  };
}

async function createGitignore(projectRoot: string): Promise<void> {
  const content = `
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/

# Platform-specific
platforms/ios/.build/
platforms/ios/DerivedData/
platforms/android/build/
platforms/android/.gradle/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
`.trim();

  await ensureDir(projectRoot);
  const fs = require('fs-extra');
  await fs.writeFile(path.join(projectRoot, '.gitignore'), content);
}

async function createReadme(
  projectRoot: string,
  projectName: string,
  platforms: Platform[]
): Promise<void> {
  const content = `# ${projectName}

Cuppa cross-platform application

## Platforms

${platforms.map((p) => `- ${p.toUpperCase()}`).join('\n')}

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
${platforms.includes('ios') ? '- Xcode 15+\n' : ''}${platforms.includes('android') ? '- Android Studio\n' : ''}

### Development

\`\`\`bash
# Generate models from specs
cuppa generate model User --from cuppa-specs/models/User.schema.json

# Add a plugin
cuppa add plugin @cuppa/analytics

# Generate API client
cuppa generate api-client --from cuppa-specs/api/v1/openapi.yaml
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── cuppa.config.json       # Cuppa configuration
├── cuppa-specs/            # Specifications
│   ├── models/            # Data models (JSON Schema)
│   ├── api/               # API specs (OpenAPI)
│   └── design/            # Design tokens
├── platforms/
${platforms.includes('ios') ? '│   ├── ios/               # iOS project\n' : ''}${platforms.includes('android') ? '│   ├── android/           # Android project\n' : ''}${platforms.includes('web') ? '│   └── web/               # Web project\n' : ''}\`\`\`

## Documentation

- [Cuppa Documentation](https://docs.mycuppa.io)
- [cuppa-cli Guide](https://docs.mycuppa.io/cuppa-cli)

## License

MIT
`;

  const fs = require('fs-extra');
  await fs.writeFile(path.join(projectRoot, 'README.md'), content);
}
