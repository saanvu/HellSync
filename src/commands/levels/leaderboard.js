const { EmbedBuilder } = require('discord.js');
const Level = require('../../models/Level');

module.exports = {
  name: 'leaderboard',
  description: 'View the XP leaderboard',
  category: 'Levels',
  usage: '.leaderboard',
  async execute(message, args, client) {
    const top = await Level.find({ guildId: message.guild.id })
      .sort({ level: -1, xp: -1 }).limit(10);

    if (!top.length) return message.reply('❌ No leaderboard data yet.');

    const medals = ['🥇','🥈','🥉'];
    const lines = await Promise.all(top.map(async (e, i) => {
      const user = await client.users.fetch(e.userId).catch(() => null);
      const rank = medals[i] ?? `\`${i + 1}.\``;
      return `${rank} **${user?.username ?? 'Unknown'}** — Level **${e.level}** · ${e.xp} XP`;
    }));

    message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle(`🏆 ${message.guild.name} — Leaderboard`)
        .setDescription(lines.join('\n'))
        .setFooter({ text: `Top ${top.length} members` })
      ]
    });
  }
};