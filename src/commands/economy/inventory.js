const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'inventory',
  description: 'View your inventory',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory'),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    
    try {
      const userData = await User.findOne({ userId: message.author.id });
      
      if (!userData || !userData.inventory || userData.inventory.length === 0) {
        return message.reply({ 
          content: '🎒 Your inventory is empty! Use `!shop` to buy items.' 
        });
      }

      const embed = {
        color: 0x00D26A,
        title: `🎒 ${message.author.username}'s Inventory`,
        description: 'Here are all your items:',
        fields: userData.inventory.map(item => ({
          name: item.name,
          value: `Quantity: ${item.quantity}\n\`ID: ${item.itemId}\``,
          inline: true
        })),
        footer: { text: 'Use !sell <item_id> <quantity> to sell items' },
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Inventory error:', error);
      await message.reply({ content: 'There was an error checking your inventory!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const User = require('../../models/User');
    
    try {
      const userData = await User.findOne({ userId: interaction.user.id });
      
      if (!userData || !userData.inventory || userData.inventory.length === 0) {
        return interaction.reply({ 
          content: '🎒 Your inventory is empty! Use `/shop` to buy items.' 
        });
      }

      const embed = {
        color: 0x00D26A,
        title: `🎒 ${interaction.user.username}'s Inventory`,
        description: 'Here are all your items:',
        fields: userData.inventory.map(item => ({
          name: item.name,
          value: `Quantity: ${item.quantity}\n\`ID: ${item.itemId}\``,
          inline: true
        })),
        footer: { text: 'Use /sell <item_id> <quantity> to sell items' },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Inventory error:', error);
      await interaction.reply({ content: 'There was an error checking your inventory!', flags: [64] });
    }
  }
};