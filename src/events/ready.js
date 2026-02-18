const { loadCommands } = require('../utils/handler');
const { REST, Routes } = require('discord.js');
const chalk = require('chalk');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(chalk.blue.bold(`✓ Logged in as ${client.user.tag}`));
    console.log(chalk.blue.bold(`✓ Ready to serve in ${client.guilds.cache.size} servers`));

    client.config = require('../config');
    
    // DO NOT RE-INIT RIFFY HERE - already done in index.js
    // client.riffy.init(client.user.id); <-- REMOVED (causes duplicate Node crash)

    loadCommands(client);

    const slashCommands = [];
    client.slashCommands.forEach((command) => {
      slashCommands.push(command.data.toJSON());
    });

    const rest = new REST({ version: '10' }).setToken(client.config.token);

    try {
      console.log('⏳ Refreshing global application (/) commands...');
      await rest.put(
        Routes.applicationCommands(client.config.clientId),
        { body: slashCommands }
      );
      console.log(chalk.green.bold('✓ Successfully reloaded global application (/) commands'));
      console.log(chalk.yellow('⚠️ Global commands may take up to 1 hour to propagate'));
    } catch (error) {
      console.error(chalk.red.bold('✗ Error reloading global application (/) commands:'), error);
    }

    // Safe activity set
    try {
      client.user.setActivity(`${client.config.prefix}help | /help`, { type: 'WATCHING' });
    } catch (e) {
      console.warn('Activity set failed:', e.message);
    }

    console.log(chalk.green('🚀 HellSync is fully ready!'));
  },
};
