const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'Moderation',
  name: 'warn',
  description: 'Warn a user',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for the warning')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async executePrefix(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply({ content: 'You do not have permission to warn members!', flags: [64] });
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply({ content: 'Please mention a user to warn!', flags: [64] });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      // Store warning in database (simplified - you'd normally use a proper database)
      const warning = {
        userId: user.id,
        moderatorId: message.author.id,
        reason: reason,
        timestamp: new Date().toISOString()
      };

      // This is a simple approach - in production you'd use MongoDB
      const warnings = client.warnings || new Map();
      if (!warnings.has(user.id)) {
        warnings.set(user.id, []);
      }
      warnings.get(user.id).push(warning);
      client.warnings = warnings;

      await message.reply({ content: `✅ Successfully warned ${user.tag} for: ${reason}` });

      // Try to DM the user
      try {
        await user.send({
          content: `You have been warned in ${message.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
        });
      } catch (err) {
        // User has DMs disabled
      }

    } catch (error) {
      console.error('Warn error:', error);
      await message.reply({ content: 'There was an error trying to warn that user!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      // Store warning in database
      const warning = {
        userId: user.id,
        moderatorId: interaction.user.id,
        reason: reason,
        timestamp: new Date().toISOString()
      };

      const warnings = interaction.client.warnings || new Map();
      if (!warnings.has(user.id)) {
        warnings.set(user.id, []);
      }
      warnings.get(user.id).push(warning);
      interaction.client.warnings = warnings;

      await interaction.reply({ content: `✅ Successfully warned ${user.tag} for: ${reason}` });

      // Try to DM the user
      try {
        await user.send({
          content: `You have been warned in ${interaction.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`
        });
      } catch (err) {
        // User has DMs disabled
      }

    } catch (error) {
      console.error('Warn error:', error);
      await interaction.reply({ content: 'There was an error trying to warn that user!', flags: [64] });
    }
  }
};