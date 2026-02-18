const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Music',
  name: 'stop',
  description: 'Stop the music and clear the queue',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),

  async executePrefix(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply({ 
        content: '❌ You need to be in a voice channel to stop music!', 
        flags: [64]
      });
    }

    const player = client.riffy?.players.get(message.guild.id);
    if (!player) {
      return message.reply({ 
        content: '❌ There is no music playing right now!', 
        flags: [64]
      });
    }

    try {
      player.destroy();
      
      const embed = {
        color: 0xFF4444,
        title: '⏹️ Music Stopped',
        description: 'Music has been stopped and queue has been cleared!',
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Stop error:', error);
      await message.reply({ content: '❌ There was an error stopping the music!', flags: [64] });
    }
  },

  async executeSlash(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ You need to be in a voice channel to stop music!', 
        flags: [64]
      });
    }

    const player = client.riffy?.players.get(interaction.guild.id);
    if (!player) {
      return interaction.reply({ 
        content: '❌ There is no music playing right now!', 
        flags: [64]
      });
    }

    try {
      player.destroy();
      
      const embed = {
        color: 0xFF4444,
        title: '⏹️ Music Stopped',
        description: 'Music has been stopped and queue has been cleared!',
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Stop error:', error);
      await interaction.reply({ content: '❌ There was an error stopping the music!', flags: [64] });
    }
  }
};