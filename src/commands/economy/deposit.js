const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'deposit',
  description: 'Deposit money from wallet to bank',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Deposit money from wallet to bank')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount to deposit (or "all")')
        .setMinValue(1))
    .addStringOption(option => 
      option.setName('action')
        .setDescription('Deposit amount')
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
        amount = userData.balance;
      } else if (action === 'half') {
        amount = Math.floor(userData.balance / 2);
      } else {
        amount = parseInt(args[0]);
      }

      if (isNaN(amount) || amount < 1) {
        return message.reply({ 
          content: 'Please specify a valid amount or use "all"/"half"!',
          flags: [64]
        });
      }

      if (userData.balance < amount) {
        return message.reply({ 
          content: `You don't have enough money! You have $${userData.balance} in your wallet.`,
          flags: [64]
        });
      }

      userData.balance -= amount;
      userData.bank += amount;
      await userData.save();

      const embed = {
        color: 0x00D26A,
        title: '🏦 Deposit Successful!',
        description: `You deposited **$${amount.toLocaleString()}** to your bank account`,
        fields: [
          { name: '💵 Wallet Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🏦 Bank Balance', value: `$${userData.bank.toLocaleString()}`, inline: true },
          { name: '💎 Total Balance', value: `$${(userData.balance + userData.bank).toLocaleString()}`, inline: true }
        ],
        footer: { text: '💰 Money in bank is safe from being robbed!' },
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Deposit error:', error);
      await message.reply({ content: 'There was an error depositing money!', flags: [64] });
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

      let depositAmount;
      
      if (action === 'all') {
        depositAmount = userData.balance;
      } else if (action === 'half') {
        depositAmount = Math.floor(userData.balance / 2);
      } else if (amount) {
        depositAmount = amount;
      } else {
        return interaction.reply({ 
          content: 'Please specify an amount or choose "all"/"half"!',
          flags: [64]
        });
      }

      if (userData.balance < depositAmount) {
        return interaction.reply({ 
          content: `You don't have enough money! You have $${userData.balance} in your wallet.`,
          flags: [64]
        });
      }

      userData.balance -= depositAmount;
      userData.bank += depositAmount;
      await userData.save();

      const embed = {
        color: 0x00D26A,
        title: '🏦 Deposit Successful!',
        description: `You deposited **$${depositAmount.toLocaleString()}** to your bank account`,
        fields: [
          { name: '💵 Wallet Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🏦 Bank Balance', value: `$${userData.bank.toLocaleString()}`, inline: true },
          { name: '💎 Total Balance', value: `$${(userData.balance + userData.bank).toLocaleString()}`, inline: true }
        ],
        footer: { text: '💰 Money in bank is safe from being robbed!' },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Deposit error:', error);
      await interaction.reply({ content: 'There was an error depositing money!', flags: [64] });
    }
  }
};