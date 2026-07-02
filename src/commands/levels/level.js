const { EmbedBuilder } = require('discord.js');
const Level = require('../../models/Level');
const { getXpForLevel } = require('../../utils/levelUtils');

module.exports = {
  name: 'level',
  description: 'Check your or someone\'s level',
  category: 'Levels',
  usage: '.level [@user]',
  async execute(message, args, client) {
    const target = message.mentions.users.first() ?? message.author;
    const data = await Level.findOne({ guildId: message.guild.id, userId: target.id });

    if (!data || data.level === 0 && data.xp === 0) {
      return message.channel.send({
        embeds: [new EmbedBuilder()
          .setColor(0xFEE75C)
          .setDescription(`📊 **${target.username}** hasn't earned any XP yet!`)
        ]
      });
    }

    const needed = getXpForLevel(data.level);
    const filled = Math.floor((data.xp / needed) * 20);
    const bar = `${'█'.repeat(filled)}${'░'.repeat(20 - filled)}`;

    message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📊 ${target.username}'s Level`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Level',    value: `\`${data.level}\``,          inline: true },
          { name: 'XP',       value: `\`${data.xp} / ${needed}\``, inline: true },
          { name: 'Progress', value: `\`[${bar}]\`` }
        )
      ]
    });
  }
};