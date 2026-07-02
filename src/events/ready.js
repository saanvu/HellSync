const { REST, Routes, ActivityType } = require('discord.js');
const chalk = require('chalk');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(chalk.blue.bold(`✓ Logged in as ${client.user.tag}`));
    console.log(chalk.blue.bold(`✓ Ready to serve in ${client.guilds.cache.size} servers`));

    client.config = require('../config');

    const slashCommands = [];
    client.slashCommands.forEach((command) => {
      if (command.data?.toJSON) {
        slashCommands.push(command.data.toJSON());
      }
    });

    if (!client.config.token || !client.config.clientId) {
      console.warn(chalk.yellow('⚠ Skipping slash command registration: missing DISCORD_TOKEN or CLIENT_ID'));
    } else {
      const rest = new REST({ version: '10' }).setToken(client.config.token);

      try {
        console.log('⏳ Refreshing global application (/) commands...');
        await rest.put(
          Routes.applicationCommands(client.config.clientId),
          { body: slashCommands }
        );
        console.log(chalk.green.bold(`✓ Successfully reloaded ${slashCommands.length} global application (/) commands`));
        console.log(chalk.yellow('⚠️ Global commands may take up to 1 hour to propagate'));
      } catch (error) {
        console.error(chalk.red.bold('✗ Error reloading global application (/) commands:'), error);
      }
    }

    // Safe activity set
    try {
      client.user.setActivity(`${client.config.prefix}help | /help`, { type: ActivityType.Watching });
    } catch (e) {
      console.warn('Activity set failed:', e.message);
    }

    console.log(chalk.green('🚀 HellSync is fully ready!'));
  },
};
