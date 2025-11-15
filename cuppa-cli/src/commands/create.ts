import { Command } from 'commander';
import { logger } from '../utils/logger';
import { CreateOptions } from '../types';

export const createCommand = new Command('create')
  .description('Create a new Cuppa project with full scaffolding')
  .argument('<project-name>', 'Project name')
  .option('-p, --platforms <platforms>', 'Platforms (ios,android,web)')
  .option('-t, --template <template>', 'Template (default, minimal, full)', 'default')
  .option('-f, --features <features>', 'Features to include (auth,analytics,theme)')
  .option('--plugins <plugins>', 'Plugins to install')
  .option('--api-spec <path>', 'OpenAPI spec for API client generation')
  .option('--no-examples', 'Skip example screens')
  .action(async (projectName: string, options: CreateOptions) => {
    logger.warn('`cuppa create` is not yet implemented');
    logger.info('Use `cuppa init` for now, then add features with `cuppa add`');
    logger.log('');
    logger.info(`Equivalent commands:`);
    logger.log(`  cuppa init ${projectName} --platforms ${options.platforms || 'ios,web'}`);
    if (options.features) {
      logger.log(`  cuppa add feature ${options.features}`);
    }
    if (options.plugins) {
      logger.log(`  cuppa add plugin ${options.plugins}`);
    }
  });
