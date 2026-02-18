const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Utility',
  name: 'ping',
  description: 'Check the bot latency',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency'),

  // Prefix command execution
  async executePrefix(message, args, client) {
    const sent = await message.reply('Pinging...');
    const timeDiff = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`🏓 Pong! Latency: ${timeDiff}ms`);
  },

  // Slash command execution
  async executeSlash(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const timeDiff = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`🏓 Pong! Latency: ${timeDiff}ms`);
  }
};