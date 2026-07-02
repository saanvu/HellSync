const { EmbedBuilder } = require('discord.js');
const Level = require('../../models/Level');
const { getXpForLevel } = require('../../utils/levelUtils');

module.exports = {
  name: 'voice',
  description: 'Voice XP commands',
  category: 'Voice',
  usage: '.voice module level | .voice module leaderboard',
  async execute(message, args, client) {
    if (args[0] !== 'module') return message.reply(`Usage: \`${this.usage}\``);
    const sub = args[1]?.toLowerCase();

    if (sub === 'level') {
      const target = message.mentions.users.first() ?? message.author;
      const data = await Level.findOne({ guildId: message.guild.id, userId: target.id });
      if (!data) return message.reply(`🎙️ **${target.username}** has no voice XP yet.`);

      const needed = getXpForLevel(data.voiceLevel);
      const filled = Math.floor((data.voiceXp / needed) * 20);
      const bar = `${'█'.repeat(filled)}${'░'.repeat(20 - filled)}`;

      message.channel.send({
        embeds: [new EmbedBuilder()
          .setColor(0xEB459E)
          .setTitle(`🎙️ ${target.username}'s Voice Level`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'Voice Level', value: `\`${data.voiceLevel}\``,          inline: true },
            { name: 'Voice XP',    value: `\`${data.voiceXp} / ${needed}\``, inline: true },
            { name: 'Progress',    value: `\`[${bar}]\`` }
          )
        ]
      });

    } else if (sub === 'leaderboard') {
      const top = await Level.find({ guildId: message.guild.id })
        .sort({ voiceLevel: -1, voiceXp: -1 }).limit(10);
      if (!top.length) return message.reply('❌ No voice data yet.');

      const medals = ['🥇','🥈','🥉'];
      const lines = await Promise.all(top.map(async (e, i) => {
        const user = await client.users.fetch(e.userId).catch(() => null);
        return `${medals[i] ?? `\`${i + 1}.\``} **${user?.username ?? 'Unknown'}** — VL **${e.voiceLevel}** · ${e.voiceXp} XP`;
      }));

      message.channel.send({
        embeds: [new EmbedBuilder()
          .setColor(0xEB459E)
          .setTitle(`🎙️ ${message.guild.name} — Voice Leaderboard`)
          .setDescription(lines.join('\n'))
        ]
      });
    } else {
      message.reply(`Usage: \`${this.usage}\``);
    }
  }
};