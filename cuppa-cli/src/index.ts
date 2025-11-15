#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { createCommand } from './commands/create';
import { generateCommand } from './commands/generate';
import { addCommand } from './commands/add';
import { validateCommand } from './commands/validate';
import { pluginCommand } from './commands/plugin';
import { componentCommand } from './commands/component';

const program = new Command();

program
  .name('cuppa')
  .description('CLI tool for scaffolding and managing Cuppa projects')
  .version('0.1.0');

// Register commands
program.addCommand(initCommand);
program.addCommand(createCommand);
program.addCommand(generateCommand);
program.addCommand(addCommand);
program.addCommand(validateCommand);
program.addCommand(pluginCommand);
program.addCommand(componentCommand);

// Error handling
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
