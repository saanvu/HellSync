const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'rob',
  description: 'Attempt to rob another user',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Attempt to rob another user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to rob')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount to attempt to rob')
        .setMinValue(10)
        .setMaxValue(1000)),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    
    if (args.length < 1) {
      return message.reply({ 
        content: 'Usage: `!rob <user> [amount]`', 
        flags: [64] 
      });
    }

    const user = message.mentions.users.first();
    const amount = parseInt(args[1]) || Math.floor(Math.random() * 500) + 100;

    if (!user) {
      return message.reply({ content: 'Please mention a valid user to rob!', flags: [64] });
    }

    if (user.id === message.author.id) {
      return message.reply({ content: 'You can\'t rob yourself!', flags: [64] });
    }

    if (user.bot) {
      return message.reply({ content: 'You can\'t rob bots!', flags: [64] });
    }

    try {
      let userData = await User.findOne({ userId: message.author.id });
      let targetData = await User.findOne({ userId: user.id });

      if (!userData) {
        return message.reply({ content: 'You need a bank account to rob! Use `!balance` to create one.', flags: [64] });
      }

      if (!targetData || targetData.balance < 50) {
        return message.reply({ 
          content: `**${user.username}** doesn't have enough money to be worth robbing!`,
          flags: [64]
        });
      }

      // Cooldown system
      const cooldown = 30 * 60 * 1000; // 30 minutes
      const now = Date.now();
      
      if (userData.lastRob && (userData.lastRob + cooldown) > now) {
        const timeLeft = Math.ceil((userData.lastRob + cooldown - now) / 60000);
        return message.reply({ 
          content: `⏰ You can rob again in ${timeLeft} minutes!` 
        });
      }

      userData.lastRob = now;

      // Rob success chance: 30% base, modified by target's wealth
      const targetWealth = targetData.balance;
      let successChance = 30;
      
      if (targetWealth < 200) successChance = 40;
      else if (targetWealth < 500) successChance = 35;
      else if (targetWealth > 2000) successChance = 25;
      else if (targetWealth > 5000) successChance = 20;

      const success = Math.random() * 100 < successChance;
      
      // Determine actual amount stolen
      let stolenAmount = 0;
      if (success) {
        stolenAmount = Math.min(amount, Math.floor(targetData.balance * 0.3)); // Max 30% of target's balance
        stolenAmount = Math.max(stolenAmount, 50); // Min $50 if successful
      }

      userData.balance += stolenAmount;
      
      if (success) {
        targetData.balance -= stolenAmount;
      } else {
        const penalty = Math.floor(amount * 0.5); // Pay 50% of attempted amount as fine
        userData.balance -= penalty;
      }

      await userData.save();
      await targetData.save();

      const embed = {
        color: success ? 0x00D26A : 0xFF4444,
        title: success ? '🏴‍☠️ Successful Robbery!' : '🚔 Caught!',
        description: success 
          ? `You successfully robbed **${user.username}** and stole **$${stolenAmount}**!`
          : `You were caught trying to rob **${user.username}**! You paid a fine of **$${Math.floor(amount * 0.5)}**.`,
        fields: [
          { name: success ? '💰 Stolen' : '💸 Fine Paid', value: `$${success ? stolenAmount : Math.floor(amount * 0.5)}`, inline: true },
          { name: '💵 Your Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🎯 Success Rate', value: `${successChance}%`, inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });

      // Notify the victim if successful
      if (success) {
        try {
          await user.send({
            content: `⚠️ You were robbed by **${message.author.username}** and lost **$${stolenAmount}**! Keep your money safe!`
          });
        } catch (err) {
          // User has DMs disabled
        }
      }
      
    } catch (error) {
      console.error('Rob error:', error);
      await message.reply({ content: 'There was an error attempting to rob!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const User = require('../../models/User');
    
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount') || Math.floor(Math.random() * 500) + 100;

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: 'You can\'t rob yourself!', flags: [64] });
    }

    if (user.bot) {
      return interaction.reply({ content: 'You can\'t rob bots!', flags: [64] });
    }

    try {
      let userData = await User.findOne({ userId: interaction.user.id });
      let targetData = await User.findOne({ userId: user.id });

      if (!userData) {
        return interaction.reply({ content: 'You need a bank account to rob! Use `/balance` to create one.', flags: [64] });
      }

      if (!targetData || targetData.balance < 50) {
        return interaction.reply({ 
          content: `**${user.username}** doesn't have enough money to be worth robbing!`,
          flags: [64]
        });
      }

      // Cooldown system
      const cooldown = 30 * 60 * 1000; // 30 minutes
      const now = Date.now();
      
      if (userData.lastRob && (userData.lastRob + cooldown) > now) {
        const timeLeft = Math.ceil((userData.lastRob + cooldown - now) / 60000);
        return interaction.reply({ 
          content: `⏰ You can rob again in ${timeLeft} minutes!` 
        });
      }

      userData.lastRob = now;

      // Rob success chance: 30% base, modified by target's wealth
      const targetWealth = targetData.balance;
      let successChance = 30;
      
      if (targetWealth < 200) successChance = 40;
      else if (targetWealth < 500) successChance = 35;
      else if (targetWealth > 2000) successChance = 25;
      else if (targetWealth > 5000) successChance = 20;

      const success = Math.random() * 100 < successChance;
      
      // Determine actual amount stolen
      let stolenAmount = 0;
      if (success) {
        stolenAmount = Math.min(amount, Math.floor(targetData.balance * 0.3));
        stolenAmount = Math.max(stolenAmount, 50);
      }

      userData.balance += stolenAmount;
      
      if (success) {
        targetData.balance -= stolenAmount;
      } else {
        const penalty = Math.floor(amount * 0.5);
        userData.balance -= penalty;
      }

      await userData.save();
      await targetData.save();

      const embed = {
        color: success ? 0x00D26A : 0xFF4444,
        title: success ? '🏴‍☠️ Successful Robbery!' : '🚔 Caught!',
        description: success 
          ? `You successfully robbed **${user.username}** and stole **$${stolenAmount}**!`
          : `You were caught trying to rob **${user.username}**! You paid a fine of **$${Math.floor(amount * 0.5)}**.`,
        fields: [
          { name: success ? '💰 Stolen' : '💸 Fine Paid', value: `$${success ? stolenAmount : Math.floor(amount * 0.5)}`, inline: true },
          { name: '💵 Your Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🎯 Success Rate', value: `${successChance}%`, inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });

      // Notify the victim if successful
      if (success) {
        try {
          await user.send({
            content: `⚠️ You were robbed by **${interaction.user.username}** and lost **$${stolenAmount}**! Keep your money safe!`
          });
        } catch (err) {
          // User has DMs disabled
        }
      }
      
    } catch (error) {
      console.error('Rob error:', error);
      await interaction.reply({ content: 'There was an error attempting to rob!', flags: [64] });
    }
  }
};