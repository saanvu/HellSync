const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'leaderboard',
  description: 'Show the richest users on the server',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the richest users on the server')
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type of leaderboard')
        .addChoices(
          { name: '💰 Total Balance', value: 'total' },
          { name: '💵 Wallet Balance', value: 'wallet' },
          { name: '🏦 Bank Balance', value: 'bank' }
        ))
    .addIntegerOption(option => 
      option.setName('top')
        .setDescription('Number of users to show (1-20)')
        .setMinValue(1)
        .setMaxValue(20)),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    
    try {
      const type = args[0]?.toLowerCase() || 'total';
      const top = Math.min(parseInt(args[1]) || 10, 20);

      // Get users from this server only
      const serverMembers = message.guild.members.cache.map(member => member.id);
      
      let users = await User.find({ userId: { $in: serverMembers } })
        .sort({ 'balance': -1, 'bank': -1 })
        .limit(top);

      // Sort based on type
      users.sort((a, b) => {
        const aTotal = type === 'wallet' ? a.balance : (type === 'bank' ? a.bank : a.balance + a.bank);
        const bTotal = type === 'wallet' ? b.balance : (type === 'bank' ? b.bank : b.balance + b.bank);
        return bTotal - aTotal;
      });

      if (users.length === 0) {
        return message.reply({ content: 'No users found on this server!' });
      }

      const embed = {
        color: 0xFFD700,
        title: `🏆 ${type.charAt(0).toUpperCase() + type.slice(1)} Leaderboard - Top ${users.length}`,
        description: `Richest users in **${message.guild.name}**`,
        fields: users.map((user, index) => {
          const value = type === 'wallet' ? user.balance : (type === 'bank' ? user.bank : user.balance + user.bank);
          return {
            name: `#${index + 1} ${user.username}`,
            value: `💰 $${value.toLocaleString()}`,
            inline: true
          };
        }),
        footer: { text: `${type.charAt(0).toUpperCase() + type.slice(1)} Balance Rankings` },
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Leaderboard error:', error);
      await message.reply({ content: 'There was an error fetching the leaderboard!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const User = require('../../models/User');
    
    const type = interaction.options.getString('type') || 'total';
    const top = Math.min(interaction.options.getInteger('top') || 10, 20);

    try {
      // Get users from this server only
      const serverMembers = interaction.guild.members.cache.map(member => member.id);
      
      let users = await User.find({ userId: { $in: serverMembers } })
        .sort({ 'balance': -1, 'bank': -1 })
        .limit(top);

      // Sort based on type
      users.sort((a, b) => {
        const aTotal = type === 'wallet' ? a.balance : (type === 'bank' ? a.bank : a.balance + a.bank);
        const bTotal = type === 'wallet' ? b.balance : (type === 'bank' ? b.bank : b.balance + b.bank);
        return bTotal - aTotal;
      });

      if (users.length === 0) {
        return interaction.reply({ content: 'No users found on this server!' });
      }

      const embed = {
        color: 0xFFD700,
        title: `🏆 ${type.charAt(0).toUpperCase() + type.slice(1)} Leaderboard - Top ${users.length}`,
        description: `Richest users in **${interaction.guild.name}**`,
        fields: users.map((user, index) => {
          const value = type === 'wallet' ? user.balance : (type === 'bank' ? user.bank : user.balance + user.bank);
          return {
            name: `#${index + 1} ${user.username}`,
            value: `💰 $${value.toLocaleString()}`,
            inline: true
          };
        }),
        footer: { text: `${type.charAt(0).toUpperCase() + type.slice(1)} Balance Rankings` },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Leaderboard error:', error);
      await interaction.reply({ content: 'There was an error fetching the leaderboard!', flags: [64] });
    }
  }
};