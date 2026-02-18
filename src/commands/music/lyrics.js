const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Music',
  name: 'lyrics',
  description: 'Get lyrics for the currently playing song',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Get lyrics for the currently playing song'),

  async executePrefix(message, args, client) {
    const player = client.riffy?.players.get(message.guild.id);
    
    if (!player || !player.queue.current) {
      return message.reply({ 
        content: '❌ There is no song playing right now!', 
        flags: [64]
      });
    }

    try {
      const track = player.queue.current;
      const query = `${track.info.author} ${track.info.title}`;
      
      // Using a simple lyrics search (in production, you'd use a proper lyrics API)
      const lyrics = await searchLyrics(query);
      
      if (!lyrics) {
        return message.reply({ 
          content: `❌ Could not find lyrics for **${track.info.title}** by **${track.info.author}**!`, 
          flags: [64]
        });
      }

      // Split lyrics if too long
      const maxChars = 2000;
      const lyricsChunks = [];
      for (let i = 0; i < lyrics.length; i += maxChars) {
        lyricsChunks.push(lyrics.substring(i, i + maxChars));
      }

      const embed = {
        color: 0x1DB954,
        title: `🎵 Lyrics - ${track.info.title}`,
        description: lyricsChunks[0],
        fields: [
          { name: '👤 Artist', value: track.info.author, inline: true },
          { name: '🎵 Song', value: track.info.title, inline: true }
        ],
        footer: { text: '⚠️ Lyrics are for educational purposes only' },
        timestamp: new Date().toISOString()
      };

      const replyMessage = await message.reply({ embeds: [embed] });
      
      // Send additional chunks if needed
      for (let i = 1; i < lyricsChunks.length; i++) {
        await replyMessage.channel.send(`\`${lyricsChunks[i]}\``);
      }
      
    } catch (error) {
      console.error('Lyrics error:', error);
      await message.reply({ content: '❌ There was an error getting lyrics!', flags: [64] });
    }
  },

  async executeSlash(interaction, client) {
    const player = client.riffy?.players.get(interaction.guild.id);
    
    if (!player || !player.queue.current) {
      return interaction.reply({ 
        content: '❌ There is no song playing right now!', 
        flags: [64]
      });
    }

    try {
      const track = player.queue.current;
      const query = `${track.info.author} ${track.info.title}`;
      
      const lyrics = await searchLyrics(query);
      
      if (!lyrics) {
        return interaction.reply({ 
          content: `❌ Could not find lyrics for **${track.info.title}** by **${track.info.author}**!`, 
          flags: [64]
        });
      }

      // Split lyrics if too long
      const maxChars = 2000;
      const lyricsChunks = [];
      for (let i = 0; i < lyrics.length; i += maxChars) {
        lyricsChunks.push(lyrics.substring(i, i + maxChars));
      }

      const embed = {
        color: 0x1DB954,
        title: `🎵 Lyrics - ${track.info.title}`,
        description: lyricsChunks[0],
        fields: [
          { name: '👤 Artist', value: track.info.author, inline: true },
          { name: '🎵 Song', value: track.info.title, inline: true }
        ],
        footer: { text: '⚠️ Lyrics are for educational purposes only' },
        timestamp: new Date().toISOString()
      };

      const replyMessage = await interaction.reply({ embeds: [embed] });
      
      // Send additional chunks if needed
      for (let i = 1; i < lyricsChunks.length; i++) {
        await replyMessage.channel.send(`\`${lyricsChunks[i]}\``);
      }
      
    } catch (error) {
      console.error('Lyrics error:', error);
      await interaction.reply({ content: '❌ There was an error getting lyrics!', flags: [64] });
    }
  }
};

async function searchLyrics(query) {
  // Simple mock lyrics search (in production, use a real lyrics API)
  const lyrics = {
    'Never Gonna Give You Up': 'Never gonna give you up\nNever gonna let you down\nNever gonna run around and desert you\nNever gonna make you cry, never gonna say goodbye',
    'Bohemian Rhapsody': 'Is this the real life?\nIs this just fantasy?\nCaught in a landslide\nNo escape from reality',
    'Sweet Child O Mine': 'Sweet child o\' mine\nSweet love of mine\nHe\'s got eyes of the bluest skies',
    default: `🎶 ${query} 🎶\n\n[ Lyrics would be displayed here ]\n\n🎵 Full lyrics not available`
  };

  // Simple matching logic
  for (const [song, lyrics] of Object.entries(lyrics)) {
    if (query.toLowerCase().includes(song.toLowerCase())) {
      return lyrics;
    }
  }

  return lyrics.default;
}