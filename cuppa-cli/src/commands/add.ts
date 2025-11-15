import { Command } from 'commander';
import { logger } from '../utils/logger';

export const addCommand = new Command('add')
  .description('Add features, plugins, or modules')
  .argument('<type>', 'Type (plugin, feature, dependency)')
  .argument('<name>', 'Name of the item to add')
  .option('--platform <name>', 'Target platform')
  .option('--config <json>', 'Configuration JSON')
  .option('--version <ver>', 'Specific version')
  .action(async (type: string, name: string, options: any) => {
    logger.warn(`\`cuppa add ${type}\` is not yet implemented`);
    logger.info('This feature will be available in Phase 3');
  });
