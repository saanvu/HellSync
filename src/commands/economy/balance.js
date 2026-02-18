const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'balance',
  description: 'Check your or someone else\'s balance',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your or someone else\'s balance')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to check balance of')
        .setRequired(false)),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    
    let user = message.mentions.users.first() || message.author;
    
    try {
      let userData = await User.findOne({ userId: user.id });
      
      if (!userData) {
        userData = new User({
          userId: user.id,
          username: user.username,
          tag: user.tag,
          balance: 0,
          bank: 0
        });
        await userData.save();
      }

      const embed = {
        color: 0x00D26A,
        title: `💰 ${user.username}'s Balance`,
        thumbnail: { url: user.displayAvatarURL({ dynamic: true }) },
        fields: [
          { name: '💵 Wallet', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🏦 Bank', value: `$${userData.bank.toLocaleString()}`, inline: true },
          { name: '💎 Total', value: `$${(userData.balance + userData.bank).toLocaleString()}`, inline: true }
        ],
        footer: { text: 'Use !work, !daily, and !gamble to earn money!' },
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Balance error:', error);
      await message.reply({ content: 'There was an error checking balance!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const User = require('../../models/User');
    
    const user = interaction.options.getUser('user') || interaction.user;
    
    try {
      let userData = await User.findOne({ userId: user.id });
      
      if (!userData) {
        userData = new User({
          userId: user.id,
          username: user.username,
          tag: user.tag,
          balance: 0,
          bank: 0
        });
        await userData.save();
      }

      const embed = {
        color: 0x00D26A,
        title: `💰 ${user.username}'s Balance`,
        thumbnail: { url: user.displayAvatarURL({ dynamic: true }) },
        fields: [
          { name: '💵 Wallet', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🏦 Bank', value: `$${userData.bank.toLocaleString()}`, inline: true },
          { name: '💎 Total', value: `$${(userData.balance + userData.bank).toLocaleString()}`, inline: true }
        ],
        footer: { text: 'Use /work, /daily, and /gamble to earn money!' },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Balance error:', error);
      await interaction.reply({ content: 'There was an error checking balance!', flags: [64] });
    }
  }
};