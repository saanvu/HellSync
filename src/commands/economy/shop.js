const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'shop',
  description: 'View the server shop',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View the server shop'),

  async executePrefix(message, args, client) {
    const shopItems = [
      { name: '🍕 Pizza', price: 50, emoji: '🍕', id: 'pizza' },
      { name: '🍔 Burger', price: 40, emoji: '🍔', id: 'burger' },
      { name: '🌮 Taco', price: 30, emoji: '🌮', id: 'taco' },
      { name: '🍦 Ice Cream', price: 35, emoji: '🍦', id: 'ice_cream' },
      { name: '🍰 Cake', price: 80, emoji: '🍰', id: 'cake' },
      { name: '🍷 Wine', price: 150, emoji: '🍷', id: 'wine' },
      { name: '💎 Diamond', price: 5000, emoji: '💎', id: 'diamond' },
      { name: '🏆 Trophy', price: 3000, emoji: '🏆', id: 'trophy' },
      { name: '🎮 Game Console', price: 800, emoji: '🎮', id: 'game_console' },
      { name: '📱 Smartphone', price: 1200, emoji: '📱', id: 'smartphone' }
    ];

    const embed = {
      color: 0x00D26A,
      title: '🛒 Server Shop',
      description: 'Use `!buy <item>` to purchase items',
      thumbnail: { url: 'https://cdn-icons-png.flaticon.com/512/3081/3081081.png' },
      fields: shopItems.map((item, index) => ({
        name: `${item.emoji} ${item.name}`,
        value: `💰 $${item.price}\n\`ID: ${item.id}\``,
        inline: true
      })),
      footer: { text: 'Use !buy <item_id> to purchase!' },
      timestamp: new Date().toISOString()
    };

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const shopItems = [
      { name: '🍕 Pizza', price: 50, emoji: '🍕', id: 'pizza' },
      { name: '🍔 Burger', price: 40, emoji: '🍔', id: 'burger' },
      { name: '🌮 Taco', price: 30, emoji: '🌮', id: 'taco' },
      { name: '🍦 Ice Cream', price: 35, emoji: '🍦', id: 'ice_cream' },
      { name: '🍰 Cake', price: 80, emoji: '🍰', id: 'cake' },
      { name: '🍷 Wine', price: 150, emoji: '🍷', id: 'wine' },
      { name: '💎 Diamond', price: 5000, emoji: '💎', id: 'diamond' },
      { name: '🏆 Trophy', price: 3000, emoji: '🏆', id: 'trophy' },
      { name: '🎮 Game Console', price: 800, emoji: '🎮', id: 'game_console' },
      { name: '📱 Smartphone', price: 1200, emoji: '📱', id: 'smartphone' }
    ];

    const embed = {
      color: 0x00D26A,
      title: '🛒 Server Shop',
      description: 'Use `/buy <item>` to purchase items',
      thumbnail: { url: 'https://cdn-icons-png.flaticon.com/512/3081/3081081.png' },
      fields: shopItems.map((item, index) => ({
        name: `${item.emoji} ${item.name}`,
        value: `💰 $${item.price}\n\`ID: ${item.id}\``,
        inline: true
      })),
      footer: { text: 'Use /buy <item_id> to purchase!' },
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  }
};