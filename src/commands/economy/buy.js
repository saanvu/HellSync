const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'buy',
  description: 'Buy an item from the shop',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the shop')
    .addStringOption(option => 
      option.setName('item')
        .setDescription('The item ID to buy')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('quantity')
        .setDescription('Quantity to buy (default: 1)')
        .setMinValue(1)
        .setMaxValue(10)),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    
    if (!args[0]) {
      return message.reply({ content: 'Please specify an item to buy! Use `!shop` to see available items.', flags: [64] });
    }

    try {
      let userData = await User.findOne({ userId: message.author.id });
      
      if (!userData) {
        return message.reply({ content: 'You don\'t have a bank account! Use `!balance` to create one.', flags: [64] });
      }

      const shopItems = {
        'pizza': { name: '🍕 Pizza', price: 50 },
        'burger': { name: '🍔 Burger', price: 40 },
        'taco': { name: '🌮 Taco', price: 30 },
        'ice_cream': { name: '🍦 Ice Cream', price: 35 },
        'cake': { name: '🍰 Cake', price: 80 },
        'wine': { name: '🍷 Wine', price: 150 },
        'diamond': { name: '💎 Diamond', price: 5000 },
        'trophy': { name: '🏆 Trophy', price: 3000 },
        'game_console': { name: '🎮 Game Console', price: 800 },
        'smartphone': { name: '📱 Smartphone', price: 1200 }
      };

      const itemId = args[0].toLowerCase();
      const quantity = parseInt(args[1]) || 1;
      const item = shopItems[itemId];

      if (!item) {
        return message.reply({ content: 'Invalid item! Use `!shop` to see available items.', flags: [64] });
      }

      const totalPrice = item.price * quantity;

      if (userData.balance < totalPrice) {
        return message.reply({ 
          content: `You don't have enough money! You need $${totalPrice} but only have $${userData.balance}.`,
          flags: [64]
        });
      }

      // Initialize inventory if it doesn't exist
      if (!userData.inventory) userData.inventory = [];

      // Add item to inventory
      const existingItem = userData.inventory.find(i => i.itemId === itemId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        userData.inventory.push({ itemId, name: item.name, quantity });
      }

      userData.balance -= totalPrice;
      await userData.save();

      const embed = {
        color: 0x00D26A,
        title: '🛒 Purchase Successful!',
        description: `You bought **${quantity}x ${item.name}**`,
        fields: [
          { name: '💰 Total Cost', value: `$${totalPrice}`, inline: true },
          { name: '💵 New Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🎒 Quantity', value: `${quantity}`, inline: true }
        ],
        footer: { text: 'Use !inventory to see your items' },
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Buy error:', error);
      await message.reply({ content: 'There was an error purchasing the item!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const User = require('../../models/User');
    
    const itemId = interaction.options.getString('item');
    const quantity = interaction.options.getInteger('quantity') || 1;

    try {
      let userData = await User.findOne({ userId: interaction.user.id });
      
      if (!userData) {
        return interaction.reply({ content: 'You don\'t have a bank account! Use `/balance` to create one.', flags: [64] });
      }

      const shopItems = {
        'pizza': { name: '🍕 Pizza', price: 50 },
        'burger': { name: '🍔 Burger', price: 40 },
        'taco': { name: '🌮 Taco', price: 30 },
        'ice_cream': { name: '🍦 Ice Cream', price: 35 },
        'cake': { name: '🍰 Cake', price: 80 },
        'wine': { name: '🍷 Wine', price: 150 },
        'diamond': { name: '💎 Diamond', price: 5000 },
        'trophy': { name: '🏆 Trophy', price: 3000 },
        'game_console': { name: '🎮 Game Console', price: 800 },
        'smartphone': { name: '📱 Smartphone', price: 1200 }
      };

      const item = shopItems[itemId.toLowerCase()];

      if (!item) {
        return interaction.reply({ content: 'Invalid item! Use `/shop` to see available items.', flags: [64] });
      }

      const totalPrice = item.price * quantity;

      if (userData.balance < totalPrice) {
        return interaction.reply({ 
          content: `You don't have enough money! You need $${totalPrice} but only have $${userData.balance}.`,
          flags: [64]
        });
      }

      // Initialize inventory if it doesn't exist
      if (!userData.inventory) userData.inventory = [];

      // Add item to inventory
      const existingItem = userData.inventory.find(i => i.itemId === itemId.toLowerCase());
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        userData.inventory.push({ itemId: itemId.toLowerCase(), name: item.name, quantity });
      }

      userData.balance -= totalPrice;
      await userData.save();

      const embed = {
        color: 0x00D26A,
        title: '🛒 Purchase Successful!',
        description: `You bought **${quantity}x ${item.name}**`,
        fields: [
          { name: '💰 Total Cost', value: `$${totalPrice}`, inline: true },
          { name: '💵 New Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
          { name: '🎒 Quantity', value: `${quantity}`, inline: true }
        ],
        footer: { text: 'Use /inventory to see your items' },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Buy error:', error);
      await interaction.reply({ content: 'There was an error purchasing the item!', flags: [64] });
    }
  }
};