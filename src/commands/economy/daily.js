const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'daily',
  description: 'Claim your daily reward',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    
    try {
      let userData = await User.findOne({ userId: message.author.id });
      
      if (!userData) {
        userData = new User({
          userId: message.author.id,
          username: message.author.username,
          tag: message.author.tag,
          balance: 0,
          bank: 0
        });
      }

      const cooldown = 24 * 60 * 60 * 1000; // 24 hours
      const now = Date.now();
      
      if (userData.lastDaily && (userData.lastDaily + cooldown) > now) {
        const timeLeft = Math.ceil((userData.lastDaily + cooldown - now) / (1000 * 60 * 60));
        return message.reply({ 
          content: `⏰ You can claim your daily reward again in ${timeLeft} hours!` 
        });
      }

      const baseReward = 500;
      const streakBonus = (userData.dailyStreak || 0) * 50;
      const totalReward = baseReward + streakBonus;

      userData.balance += totalReward;
      userData.lastDaily = now;
      userData.dailyStreak = (userData.dailyStreak || 0) + 1;
      await userData.save();

      const embed = {
        color: 0xFFD700,
        title: '🎁 Daily Reward!',
        description: `You claimed your daily reward!`,
        fields: [
          { name: '🎯 Base Reward', value: `$${baseReward}`, inline: true },
          { name: '🔥 Streak Bonus', value: `$${streakBonus} (${userData.dailyStreak} days)`, inline: true },
          { name: '💰 Total Reward', value: `$${totalReward}`, inline: true },
          { name: '📊 New Balance', value: `$${userData.balance.toLocaleString()}`, inline: false }
        ],
        footer: { text: `🔥 ${userData.dailyStreak} day streak! Come back tomorrow!` },
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Daily error:', error);
      await message.reply({ content: 'There was an error claiming your daily reward!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const User = require('../../models/User');
    
    try {
      let userData = await User.findOne({ userId: interaction.user.id });
      
      if (!userData) {
        userData = new User({
          userId: interaction.user.id,
          username: interaction.user.username,
          tag: interaction.user.tag,
          balance: 0,
          bank: 0
        });
      }

      const cooldown = 24 * 60 * 60 * 1000; // 24 hours
      const now = Date.now();
      
      if (userData.lastDaily && (userData.lastDaily + cooldown) > now) {
        const timeLeft = Math.ceil((userData.lastDaily + cooldown - now) / (1000 * 60 * 60));
        return interaction.reply({ 
          content: `⏰ You can claim your daily reward again in ${timeLeft} hours!` 
        });
      }

      const baseReward = 500;
      const streakBonus = (userData.dailyStreak || 0) * 50;
      const totalReward = baseReward + streakBonus;

      userData.balance += totalReward;
      userData.lastDaily = now;
      userData.dailyStreak = (userData.dailyStreak || 0) + 1;
      await userData.save();

      const embed = {
        color: 0xFFD700,
        title: '🎁 Daily Reward!',
        description: `You claimed your daily reward!`,
        fields: [
          { name: '🎯 Base Reward', value: `$${baseReward}`, inline: true },
          { name: '🔥 Streak Bonus', value: `$${streakBonus} (${userData.dailyStreak} days)`, inline: true },
          { name: '💰 Total Reward', value: `$${totalReward}`, inline: true },
          { name: '📊 New Balance', value: `$${userData.balance.toLocaleString()}`, inline: false }
        ],
        footer: { text: `🔥 ${userData.dailyStreak} day streak! Come back tomorrow!` },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Daily error:', error);
      await interaction.reply({ content: 'There was an error claiming your daily reward!', flags: [64] });
    }
  }
};