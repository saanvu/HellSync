const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Music',
  name: 'nowplaying',
  description: 'Show currently playing song information',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show currently playing song information'),

  async executePrefix(message, args, client) {
    const player = client.riffy?.players.get(message.guild.id);
    
    if (!player || !player.current) {
      return message.reply({ 
        content: '❌ There is no song playing right now!', 
        flags: [64]
      });
    }

    try {
      const track = player.current;
      const progressBar = createProgressBar(player.position, track.info.length, 20);
      
      const embed = {
        color: 0x1DB954,
        title: '🎵 Now Playing',
        description: `**${track.info.title}**`,
        thumbnail: { url: track.info.thumbnail },
        fields: [
          { name: '👤 Artist', value: track.info.author, inline: true },
          { name: '⏱️ Duration', value: formatDuration(track.info.length), inline: true },
          { name: '🔂 Loop', value: player.loop === 'none' ? 'Off' : player.loop, inline: true },
          { name: '📊 Progress', value: `\`${progressBar}\``, inline: false }
        ],
        footer: { text: `👤 Requested by: ${track.info.requester.username}` },
        timestamp: new Date().toISOString()
      };

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Nowplaying error:', error);
      await message.reply({ content: '❌ There was an error getting now playing info!', flags: [64] });
    }
  },

  async executeSlash(interaction, client) {
    const player = client.riffy?.players.get(interaction.guild.id);
    
    if (!player || !player.current) {
      return interaction.reply({ 
        content: '❌ There is no song playing right now!', 
        flags: [64]
      });
    }

    try {
      const track = player.current;
      const progressBar = createProgressBar(player.position, track.info.length, 20);
      
      const embed = {
        color: 0x1DB954,
        title: '🎵 Now Playing',
        description: `**${track.info.title}**`,
        thumbnail: { url: track.info.thumbnail },
        fields: [
          { name: '👤 Artist', value: track.info.author, inline: true },
          { name: '⏱️ Duration', value: formatDuration(track.info.length), inline: true },
          { name: '🔂 Loop', value: player.loop === 'none' ? 'Off' : player.loop, inline: true },
          { name: '📊 Progress', value: `\`${progressBar}\``, inline: false }
        ],
        footer: { text: `👤 Requested by: ${track.info.requester.username}` },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Nowplaying error:', error);
      await interaction.reply({ content: '❌ There was an error getting now playing info!', flags: [64] });
    }
  }
};

function createProgressBar(position, duration, size) {
  const percentage = position / duration;
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  
  const progressString = '█'.repeat(progress);
  const emptyString = '░'.repeat(emptyProgress);
  
  const percentageText = `${Math.round(percentage * 100)}%`;
  
  return `${progressString}${emptyString} ${percentageText}`;
}

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