const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'Moderation',
  name: 'roleinfo',
  description: 'Get information about a role',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Get information about a role')
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('The role to get info about')
        .setRequired(false)),

  async executePrefix(message, args, client) {
    let role;
    
    if (message.mentions.roles.first()) {
      role = message.mentions.roles.first();
    } else if (args[0]) {
      role = message.guild.roles.cache.find(r => 
        r.name.toLowerCase() === args.join(' ').toLowerCase() ||
        r.id === args[0] ||
        `<@&${r.id}>` === args[0]
      );
    } else {
      role = message.member.roles.highest;
    }

    if (!role) {
      return message.reply({ content: 'Could not find that role!', flags: [64] });
    }

    const embed = {
      color: role.color || 0x0099FF,
      title: `🎭 Role Information: ${role.name}`,
      thumbnail: { url: role.iconURL() },
      fields: [
        { name: '🆔 Role ID', value: role.id, inline: true },
        { name: '🏷️ Name', value: role.name, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👥 Members', value: `${role.members.size}`, inline: true },
        { name: '🎨 Color', value: role.hexColor || 'Default', inline: true },
        { name: '📍 Position', value: `${role.position}`, inline: true },
        { name: '📋 Permissions', value: role.permissions.bitfield.toString(), inline: false },
        { name: '⚙️ Features', value: role.tags?.botId ? 'Bot Role' : 'Normal Role', inline: true }
      ],
      timestamp: new Date().toISOString()
    };

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    let role = interaction.options.getRole('role');
    
    if (!role) {
      role = interaction.member.roles.highest;
    }

    const embed = {
      color: role.color || 0x0099FF,
      title: `🎭 Role Information: ${role.name}`,
      thumbnail: { url: role.iconURL() },
      fields: [
        { name: '🆔 Role ID', value: role.id, inline: true },
        { name: '🏷️ Name', value: role.name, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👥 Members', value: `${role.members.size}`, inline: true },
        { name: '🎨 Color', value: role.hexColor || 'Default', inline: true },
        { name: '📍 Position', value: `${role.position}`, inline: true },
        { name: '📋 Permissions', value: role.permissions.bitfield.toString(), inline: false },
        { name: '⚙️ Features', value: role.tags?.botId ? 'Bot Role' : 'Normal Role', inline: true }
      ],
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  }
};