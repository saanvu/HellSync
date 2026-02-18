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
  name: 'queue',
  description: 'Show the current music queue',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue')
    .addIntegerOption(option => 
      option.setName('page')
        .setDescription('Page number of the queue')
        .setMinValue(1)
        .setMaxValue(10)),

  async executePrefix(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply({ 
        content: '❌ You need to be in a voice channel to see the queue!', 
        flags: [64]
      });
    }

    const player = client.riffy?.players.get(message.guild.id);
    if (!player || (!player.current && player.queue.size === 0)) {
      return message.reply({ 
        content: '❌ The queue is empty! Add some songs with `!play`', 
        flags: [64]
      });
    }

    try {
      const page = parseInt(args[0]) || 1;
      const pageSize = 10;
      const totalPages = Math.ceil(player.queue.size / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const queue = player.queue.slice(start, end);

      const currentTrack = player.current;

      const embed = {
        color: 0x1DB954,
        title: '🎵 Music Queue',
        description: `📊 Total songs: **${player.queue.size}**`,
        fields: [],
        thumbnail: currentTrack ? { url: currentTrack.info.thumbnail } : null,
        timestamp: new Date().toISOString()
      };

      // Add currently playing if exists
      if (currentTrack) {
        embed.fields.push({
          name: '🎵 Currently Playing',
          value: `**${currentTrack.info.title}**\n👤 ${currentTrack.info.author}\n⏱️ ${formatDuration(currentTrack.info.length)}\n👤 Requested by: ${currentTrack.info.requester.username}`,
          inline: false
        });
      }

      // Add queue items
      if (queue.length > 0) {
        const queueList = queue.map((track, index) => 
          `**${start + index + 1}.** ${track.info.title} - ${track.info.author}`
        ).join('\n');

        embed.fields.push({
          name: `📋 Queue (Page ${page}/${totalPages})`,
          value: queueList || 'No more songs in queue',
          inline: false
        });
      }

      embed.footer = { 
        text: totalPages > 1 ? `Page ${page} of ${totalPages}` : 'Queue' 
      };

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Queue error:', error);
      await message.reply({ content: '❌ There was an error getting the queue!', flags: [64] });
    }
  },

  async executeSlash(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ You need to be in a voice channel to see the queue!', 
        flags: [64]
      });
    }

    const player = client.riffy?.players.get(interaction.guild.id);
    if (!player || (!player.current && player.queue.size === 0)) {
      return interaction.reply({ 
        content: '❌ The queue is empty! Add some songs with `/play`', 
        flags: [64]
      });
    }

    try {
      const page = interaction.options.getInteger('page') || 1;
      const pageSize = 10;
      const totalPages = Math.ceil(player.queue.size / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const queue = player.queue.slice(start, end);

      const currentTrack = player.current;

      const embed = {
        color: 0x1DB954,
        title: '🎵 Music Queue',
        description: `📊 Total songs: **${player.queue.size}**`,
        fields: [],
        thumbnail: currentTrack ? { url: currentTrack.info.thumbnail } : null,
        timestamp: new Date().toISOString()
      };

      // Add currently playing if exists
      if (currentTrack) {
        embed.fields.push({
          name: '🎵 Currently Playing',
          value: `**${currentTrack.info.title}**\n👤 ${currentTrack.info.author}\n⏱️ ${formatDuration(currentTrack.info.length)}\n👤 Requested by: ${currentTrack.info.requester.username}`,
          inline: false
        });
      }

      // Add queue items
      if (queue.length > 0) {
        const queueList = queue.map((track, index) => 
          `**${start + index + 1}.** ${track.info.title} - ${track.info.author}`
        ).join('\n');

        embed.fields.push({
          name: `📋 Queue (Page ${page}/${totalPages})`,
          value: queueList || 'No more songs in queue',
          inline: false
        });
      }

      embed.footer = { 
        text: totalPages > 1 ? `Page ${page} of ${totalPages}` : 'Queue' 
      };

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Queue error:', error);
      await interaction.reply({ content: '❌ There was an error getting the queue!', flags: [64] });
    }
  }
};