const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'Moderation',
  name: 'warnings',
  description: 'Check warnings for a user',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Check warnings for a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to check warnings for')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async executePrefix(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    
    const warnings = client.warnings || new Map();
    const userWarnings = warnings.get(user.id) || [];

    if (userWarnings.length === 0) {
      return message.reply({ content: `${user.tag} has no warnings!` });
    }

    const embed = {
      color: 0xFF9800,
      title: `⚠️ Warnings for ${user.tag}`,
      description: `Total warnings: ${userWarnings.length}`,
      fields: userWarnings.map((warning, index) => ({
        name: `Warning #${index + 1}`,
        value: `**Reason:** ${warning.reason}\n**Date:** <t:${Math.floor(new Date(warning.timestamp).getTime() / 1000)}:F>\n**Moderator:** <@${warning.moderatorId}>`,
        inline: false
      })),
      timestamp: new Date().toISOString()
    };

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    
    const warnings = interaction.client.warnings || new Map();
    const userWarnings = warnings.get(user.id) || [];

    if (userWarnings.length === 0) {
      return interaction.reply({ content: `${user.tag} has no warnings!` });
    }

    const embed = {
      color: 0xFF9800,
      title: `⚠️ Warnings for ${user.tag}`,
      description: `Total warnings: ${userWarnings.length}`,
      fields: userWarnings.map((warning, index) => ({
        name: `Warning #${index + 1}`,
        value: `**Reason:** ${warning.reason}\n**Date:** <t:${Math.floor(new Date(warning.timestamp).getTime() / 1000)}:F>\n**Moderator:** <@${warning.moderatorId}>`,
        inline: false
      })),
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  }
};