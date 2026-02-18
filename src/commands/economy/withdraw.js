const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'withdraw',
  description: 'Withdraw money from bank to wallet',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw money from bank to wallet')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount to withdraw (or "all")')
        .setMinValue(1))
    .addStringOption(option => 
      option.setName('action')
        .setDescription('Withdraw amount')
        .addChoices(
          { name: 'All money', value: 'all' },
          { name: 'Half money', value: 'half' }
        )),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    
    try {
      let userData = await User.findOne({ userId: message.author.id });
      
      if (!userData) {
        return message.reply({ content: 'You don\'t have a bank account! Use `!balance` to create one.', flags: [64] });
      }

      let amount;
      const action = args[0]?.toLowerCase();

      if (action === 'all') {
        amount = userData.bank;
      } else if (action === 'half') {
        amount = Math.floor(userData.bank / 2);
      } else {
        amount = parseInt(args[0]);
      }

      if (isNaN(amount) || amount < 1) {
        return message.reply({ 
          content: 'Please specify a valid amount or use "all"/"half"!',
          flags: [64]
        });
      }

      if (userData.bank < amount) {
        return message.reply({ 
          content: `You don't have enough money in bank! You have $${userData.bank} in bank.`,
          flags: [64]
        });
      }

      userData.bank -= amount;
      userData.balance += amount;
      await userData.save();

      const embed = {
        color: 0x00D26A,
        title: '🏦 Withdraw Successful!',
        description: `You withdrew **$${amount.toLocaleString()}** from your bank account`,
        fields: [
          { name: '💵 Wallet Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🏦 Bank Balance', value: `$${userData.bank.toLocaleString()}`, inline: true },
          { name: '💎 Total Balance', value: `$${(userData.balance + userData.bank).toLocaleString()}`, inline: true }
        ],
        footer: { text: '⚠️ Money in wallet can be robbed!' },
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Withdraw error:', error);
      await message.reply({ content: 'There was an error withdrawing money!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const User = require('../../models/User');
    
    const amount = interaction.options.getInteger('amount');
    const action = interaction.options.getString('action');

    try {
      let userData = await User.findOne({ userId: interaction.user.id });
      
      if (!userData) {
        return interaction.reply({ content: 'You don\'t have a bank account! Use `/balance` to create one.', flags: [64] });
      }

      let withdrawAmount;
      
      if (action === 'all') {
        withdrawAmount = userData.bank;
      } else if (action === 'half') {
        withdrawAmount = Math.floor(userData.bank / 2);
      } else if (amount) {
        withdrawAmount = amount;
      } else {
        return interaction.reply({ 
          content: 'Please specify an amount or choose "all"/"half"!',
          flags: [64]
        });
      }

      if (userData.bank < withdrawAmount) {
        return interaction.reply({ 
          content: `You don't have enough money in bank! You have $${userData.bank} in bank.`,
          flags: [64]
        });
      }

      userData.bank -= withdrawAmount;
      userData.balance += withdrawAmount;
      await userData.save();

      const embed = {
        color: 0x00D26A,
        title: '🏦 Withdraw Successful!',
        description: `You withdrew **$${withdrawAmount.toLocaleString()}** from your bank account`,
        fields: [
          { name: '💵 Wallet Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🏦 Bank Balance', value: `$${userData.bank.toLocaleString()}`, inline: true },
          { name: '💎 Total Balance', value: `$${(userData.balance + userData.bank).toLocaleString()}`, inline: true }
        ],
        footer: { text: '⚠️ Money in wallet can be robbed!' },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Withdraw error:', error);
      await interaction.reply({ content: 'There was an error withdrawing money!', flags: [64] });
    }
  }
};