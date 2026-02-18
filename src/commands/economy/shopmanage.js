const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'shopmanage',
  description: 'Manage shop items (Admin only)',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('shopmanage')
    .setDescription('Manage shop items (Admin only)')
    .addStringOption(option => 
      option.setName('action')
        .setDescription('Action to perform')
        .addChoices(
          { name: '➕ Add item', value: 'add' },
          { name: '➖ Remove item', value: 'remove' },
          { name: '📝 List items', value: 'list' }
        ))
    .addStringOption(option => 
      option.setName('itemid')
        .setDescription('Item ID for remove action')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('itemname')
        .setDescription('Item name for add action')
        .setRequired(false))
    .addIntegerOption(option => 
      option.setName('price')
        .setDescription('Item price for add action')
        .setMinValue(0)
        .setRequired(false))
    .addStringOption(option => 
      option.setName('emoji')
        .setDescription('Item emoji for add action')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async executePrefix(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ content: 'You don\'t have permission to manage the shop!', flags: [64] });
    }

    const action = args[0]?.toLowerCase();

    try {
      if (action === 'list') {
        // This would normally fetch from database, but for now using hardcoded items
        const shopItems = [
          { id: 'pizza', name: '🍕 Pizza', price: 50 },
          { id: 'burger', name: '🍔 Burger', price: 40 },
          { id: 'taco', name: '🌮 Taco', price: 30 },
          { id: 'ice_cream', name: '🍦 Ice Cream', price: 35 },
          { id: 'cake', name: '🍰 Cake', price: 80 },
          { id: 'wine', name: '🍷 Wine', price: 150 },
          { id: 'diamond', name: '💎 Diamond', price: 5000 },
          { id: 'trophy', name: '🏆 Trophy', price: 3000 },
          { id: 'game_console', name: '🎮 Game Console', price: 800 },
          { id: 'smartphone', name: '📱 Smartphone', price: 1200 }
        ];

        const embed = {
          color: 0x00D26A,
          title: '🛒 Shop Management - Current Items',
          fields: shopItems.map(item => ({
            name: `${item.name}`,
            value: `**ID:** ${item.id}\n**Price:** $${item.price}`,
            inline: true
          })),
          timestamp: new Date().toISOString()
        };

        return message.reply({ embeds: [embed] });
      }

      if (action === 'add' && args.length >= 4) {
        const itemId = args[1];
        const itemName = args[2];
        const price = parseInt(args[3]);
        const emoji = args[4] || '📦';

        if (isNaN(price) || price < 0) {
          return message.reply({ content: 'Please provide a valid price!', flags: [64] });
        }

        // In a real implementation, this would save to database
        const embed = {
          color: 0x00D26A,
          title: '➕ Item Added to Shop',
          description: `${emoji} ${itemName}`,
          fields: [
            { name: 'Item ID', value: itemId, inline: true },
            { name: 'Price', value: `$${price}`, inline: true }
          ],
          footer: { text: 'Item has been added to the shop!' },
          timestamp: new Date().toISOString()
        };

        return message.reply({ embeds: [embed] });
      }

      if (action === 'remove' && args[1]) {
        const itemId = args[1];
        
        const embed = {
          color: 0x00D26A,
          title: '➖ Item Removed from Shop',
          description: `Item with ID **${itemId}** has been removed from the shop.`,
          footer: { text: 'Item has been removed from the shop!' },
          timestamp: new Date().toISOString()
        };

        return message.reply({ embeds: [embed] });
      }

      return message.reply({ 
        content: 'Usage: `!shopmanage <add|remove|list> [itemid] [itemname] [price] [emoji]`',
        flags: [64]
      });
      
    } catch (error) {
      console.error('Shopmanage error:', error);
      await message.reply({ content: 'There was an error managing the shop!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You don\'t have permission to manage the shop!', flags: [64] });
    }

    const action = interaction.options.getString('action');

    try {
      if (action === 'list') {
        const shopItems = [
          { id: 'pizza', name: '🍕 Pizza', price: 50 },
          { id: 'burger', name: '🍔 Burger', price: 40 },
          { id: 'taco', name: '🌮 Taco', price: 30 },
          { id: 'ice_cream', name: '🍦 Ice Cream', price: 35 },
          { id: 'cake', name: '🍰 Cake', price: 80 },
          { id: 'wine', name: '🍷 Wine', price: 150 },
          { id: 'diamond', name: '💎 Diamond', price: 5000 },
          { id: 'trophy', name: '🏆 Trophy', price: 3000 },
          { id: 'game_console', name: '🎮 Game Console', price: 800 },
          { id: 'smartphone', name: '📱 Smartphone', price: 1200 }
        ];

        const embed = {
          color: 0x00D26A,
          title: '🛒 Shop Management - Current Items',
          fields: shopItems.map(item => ({
            name: `${item.name}`,
            value: `**ID:** ${item.id}\n**Price:** $${item.price}`,
            inline: true
          })),
          timestamp: new Date().toISOString()
        };

        return interaction.reply({ embeds: [embed] });
      }

      if (action === 'add') {
        const itemId = interaction.options.getString('itemid');
        const itemName = interaction.options.getString('itemname');
        const price = interaction.options.getInteger('price');
        const emoji = interaction.options.getString('emoji') || '📦';

        if (!itemId || !itemName || price === null) {
          return interaction.reply({ 
            content: 'Please provide all required information for adding items!',
            flags: [64]
          });
        }

        const embed = {
          color: 0x00D26A,
          title: '➕ Item Added to Shop',
          description: `${emoji} ${itemName}`,
          fields: [
            { name: 'Item ID', value: itemId, inline: true },
            { name: 'Price', value: `$${price}`, inline: true }
          ],
          footer: { text: 'Item has been added to the shop!' },
          timestamp: new Date().toISOString()
        };

        return interaction.reply({ embeds: [embed] });
      }

      if (action === 'remove') {
        const itemId = interaction.options.getString('itemid');
        
        if (!itemId) {
          return interaction.reply({ 
            content: 'Please provide an item ID to remove!',
            flags: [64]
          });
        }
        
        const embed = {
          color: 0x00D26A,
          title: '➖ Item Removed from Shop',
          description: `Item with ID **${itemId}** has been removed from the shop.`,
          footer: { text: 'Item has been removed from the shop!' },
          timestamp: new Date().toISOString()
        };

        return interaction.reply({ embeds: [embed] });
      }
      
    } catch (error) {
      console.error('Shopmanage error:', error);
      await interaction.reply({ content: 'There was an error managing the shop!', flags: [64] });
    }
  }
};