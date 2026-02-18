const { SlashCommandBuilder } = require('discord.js');
const https = require('https');

module.exports = {
  category: 'Fun',
  name: 'meme',
  description: 'Get a random meme',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Get a random meme'),

  async executePrefix(message, args, client) {
    try {
      // Using a public meme API with built-in https module
      const data = await new Promise((resolve, reject) => {
        https.get('https://meme-api.com/gimme', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });

      if (!data.url) {
        return message.reply({ content: 'Could not fetch a meme at this time. Try again later!', flags: [64] });
      }

      const embed = {
        color: 0x00D26A,
        title: `🎭 ${data.title || 'Random Meme'}`,
        image: { url: data.url },
        footer: { text: `👍 ${data.ups} ups` },
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Meme error:', error);
      await message.reply({ content: 'Could not fetch a meme at this time. Try again later!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    try {
      // Using a public meme API with built-in https module
      const data = await new Promise((resolve, reject) => {
        https.get('https://meme-api.com/gimme', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });

      if (!data.url) {
        return interaction.reply({ content: 'Could not fetch a meme at this time. Try again later!', flags: [64] });
      }

      const embed = {
        color: 0x00D26A,
        title: `🎭 ${data.title || 'Random Meme'}`,
        image: { url: data.url },
        footer: { text: `👍 ${data.ups} ups` },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Meme error:', error);
      await interaction.reply({ content: 'Could not fetch a meme at this time. Try again later!', flags: [64] });
    }
  }
};