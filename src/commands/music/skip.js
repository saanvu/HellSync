const { SlashCommandBuilder } = require('discord.js');

function formatDuration(milliseconds) {
  if (!milliseconds || milliseconds <= 0) return '00:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

module.exports = {
  category: 'Music',
  name: 'skip',
  description: 'Skip the current song',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Number of songs to skip (default: 1)')
        .setMinValue(1)
        .setMaxValue(10)),

  async executePrefix(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply({ 
        content: '❌ You need to be in a voice channel to skip songs!', 
        flags: [64]
      });
    }

    const player = client.riffy?.players.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({ 
        content: '❌ There is no song playing right now!', 
        flags: [64]
      });
    }

    try {
      const skipAmount = parseInt(args[0]) || 1;
      let skipped = 0;

      for (let i = 0; i < skipAmount; i++) {
        if (player.queue.size > 0) {
          player.stop();
          skipped++;
        } else {
          break;
        }
      }

      const embed = {
        color: 0x1DB954,
        title: '⏭️ Song Skipped!',
        description: `Successfully skipped **${skipped}** song${skipped !== 1 ? 's' : ''}!`,
        fields: [
          { name: '📊 Queue Size', value: `${player.queue.size}`, inline: true },
          { name: '🎵 Now Playing', value: player.current ? `${player.current.info.title} (${formatDuration(player.current.info.length)})` : 'Nothing', inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Skip error:', error);
      await message.reply({ content: '❌ There was an error skipping the song!', flags: [64] });
    }
  },

  async executeSlash(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ You need to be in a voice channel to skip songs!', 
        flags: [64]
      });
    }

    const player = client.riffy?.players.get(interaction.guild.id);
    if (!player || !player.current) {
      return interaction.reply({ 
        content: '❌ There is no song playing right now!', 
        flags: [64]
      });
    }

    try {
      const skipAmount = interaction.options.getInteger('amount') || 1;
      let skipped = 0;

      for (let i = 0; i < skipAmount; i++) {
        if (player.queue.size > 0) {
          player.stop();
          skipped++;
        } else {
          break;
        }
      }

      const embed = {
        color: 0x1DB954,
        title: '⏭️ Song Skipped!',
        description: `Successfully skipped **${skipped}** song${skipped !== 1 ? 's' : ''}!`,
        fields: [
          { name: '📊 Queue Size', value: `${player.queue.size}`, inline: true },
          { name: '🎵 Now Playing', value: player.current ? `${player.current.info.title} (${formatDuration(player.current.info.length)})` : 'Nothing', inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Skip error:', error);
      await interaction.reply({ content: '❌ There was an error skipping the song!', flags: [64] });
    }
  }
};