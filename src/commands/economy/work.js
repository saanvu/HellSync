const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'work',
  description: 'Work to earn money',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn money'),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    const ms = require('ms');
    
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

      const cooldown = 60 * 60 * 1000; // 1 hour
      const now = Date.now();
      
      if (userData.lastWork && (userData.lastWork + cooldown) > now) {
        const timeLeft = Math.ceil((userData.lastWork + cooldown - now) / 1000);
        return message.reply({ 
          content: `⏰ You can work again in ${timeLeft} seconds!` 
        });
      }

      const jobs = [
        { name: 'software developer', min: 100, max: 500 },
        { name: 'graphic designer', min: 80, max: 300 },
        { name: 'content creator', min: 50, max: 200 },
        { name: 'customer support', min: 40, max: 150 },
        { name: 'data analyst', min: 120, max: 400 },
        { name: 'project manager', min: 150, max: 450 }
      ];

      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

      userData.balance += earned;
      userData.lastWork = now;
      await userData.save();

      const embed = {
        color: 0x00D26A,
        title: '💼 Work Completed!',
        description: `You worked as a **${job.name}** and earned **$${earned}**!`,
        fields: [
          { name: 'New Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: 'Next Work', value: 'in 1 hour', inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Work error:', error);
      await message.reply({ content: 'There was an error while working!', flags: [64] });
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

      const cooldown = 60 * 60 * 1000; // 1 hour
      const now = Date.now();
      
      if (userData.lastWork && (userData.lastWork + cooldown) > now) {
        const timeLeft = Math.ceil((userData.lastWork + cooldown - now) / 1000);
        return interaction.reply({ 
          content: `⏰ You can work again in ${timeLeft} seconds!` 
        });
      }

      const jobs = [
        { name: 'software developer', min: 100, max: 500 },
        { name: 'graphic designer', min: 80, max: 300 },
        { name: 'content creator', min: 50, max: 200 },
        { name: 'customer support', min: 40, max: 150 },
        { name: 'data analyst', min: 120, max: 400 },
        { name: 'project manager', min: 150, max: 450 }
      ];

      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

      userData.balance += earned;
      userData.lastWork = now;
      await userData.save();

      const embed = {
        color: 0x00D26A,
        title: '💼 Work Completed!',
        description: `You worked as a **${job.name}** and earned **$${earned}**!`,
        fields: [
          { name: 'New Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: 'Next Work', value: 'in 1 hour', inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Work error:', error);
      await interaction.reply({ content: 'There was an error while working!', flags: [64] });
    }
  }
};