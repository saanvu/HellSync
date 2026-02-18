const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'transfer',
  description: 'Transfer money to another user',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer money to another user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to transfer money to')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount to transfer')
        .setRequired(true)
        .setMinValue(1)),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    
    if (args.length < 2) {
      return message.reply({ 
        content: 'Usage: `!transfer <user> <amount>`', 
        flags: [64] 
      });
    }

    const user = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!user) {
      return message.reply({ content: 'Please mention a valid user!', flags: [64] });
    }

    if (user.id === message.author.id) {
      return message.reply({ content: 'You can\'t transfer money to yourself!', flags: [64] });
    }

    if (isNaN(amount) || amount < 1) {
      return message.reply({ content: 'Please specify a valid amount!', flags: [64] });
    }

    try {
      let senderData = await User.findOne({ userId: message.author.id });
      let receiverData = await User.findOne({ userId: user.id });

      if (!senderData) {
        return message.reply({ content: 'You don\'t have a bank account! Use `!balance` to create one.', flags: [64] });
      }

      if (!receiverData) {
        receiverData = new User({
          userId: user.id,
          username: user.username,
          tag: user.tag,
          balance: 0,
          bank: 0
        });
      }

      if (senderData.balance < amount) {
        return message.reply({ 
          content: `You don't have enough money! You have $${senderData.balance} but tried to transfer $${amount}.`,
          flags: [64]
        });
      }

      // Transfer the money
      senderData.balance -= amount;
      receiverData.balance += amount;

      await senderData.save();
      await receiverData.save();

      const embed = {
        color: 0x00D26A,
        title: '💸 Transfer Successful',
        description: `Successfully transferred **$${amount}** to **${user.username}**`,
        fields: [
          { name: '👤 Sender', value: `${message.author.username}`, inline: true },
          { name: '👥 Receiver', value: `${user.username}`, inline: true },
          { name: '💰 Amount', value: `$${amount}`, inline: true },
          { name: '💵 Your Balance', value: `$${senderData.balance.toLocaleString()}`, inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });

      // Notify the receiver
      try {
        await user.send({
          content: `💰 You received $${amount} from ${message.author.username}!`
        });
      } catch (err) {
        // User has DMs disabled
      }

    } catch (error) {
      console.error('Transfer error:', error);
      await message.reply({ content: 'There was an error transferring money!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const User = require('../../models/User');
    
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: 'You can\'t transfer money to yourself!', flags: [64] });
    }

    try {
      let senderData = await User.findOne({ userId: interaction.user.id });
      let receiverData = await User.findOne({ userId: user.id });

      if (!senderData) {
        return interaction.reply({ content: 'You don\'t have a bank account! Use `/balance` to create one.', flags: [64] });
      }

      if (!receiverData) {
        receiverData = new User({
          userId: user.id,
          username: user.username,
          tag: user.tag,
          balance: 0,
          bank: 0
        });
      }

      if (senderData.balance < amount) {
        return interaction.reply({ 
          content: `You don't have enough money! You have $${senderData.balance} but tried to transfer $${amount}.`,
          flags: [64]
        });
      }

      // Transfer the money
      senderData.balance -= amount;
      receiverData.balance += amount;

      await senderData.save();
      await receiverData.save();

      const embed = {
        color: 0x00D26A,
        title: '💸 Transfer Successful',
        description: `Successfully transferred **$${amount}** to **${user.username}**`,
        fields: [
          { name: '👤 Sender', value: `${interaction.user.username}`, inline: true },
          { name: '👥 Receiver', value: `${user.username}`, inline: true },
          { name: '💰 Amount', value: `$${amount}`, inline: true },
          { name: '💵 Your Balance', value: `$${senderData.balance.toLocaleString()}`, inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });

      // Notify the receiver
      try {
        await user.send({
          content: `💰 You received $${amount} from ${interaction.user.username}!`
        });
      } catch (err) {
        // User has DMs disabled
      }

    } catch (error) {
      console.error('Transfer error:', error);
      await interaction.reply({ content: 'There was an error transferring money!', flags: [64] });
    }
  }
};