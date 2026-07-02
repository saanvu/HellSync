const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');
const config = require('../../config');

module.exports = {
  name: 'prefix',
  description: 'View or change the server prefix',
  category: 'Prefix',
  usage: `${config.prefix}prefix [new prefix]`,
  async execute(message, args, client) {
    let s = await GuildSettings.findOne({ guildId: message.guild.id });

    if (!args[0]) {
      return message.channel.send({
        embeds: [new EmbedBuilder()
          .setColor(0x5865F2)
          .setDescription(`📌 Current prefix: \`${s?.prefix ?? config.prefix}\``)
        ]
      });
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply('❌ You need **Manage Server** to change the prefix.');
    if (args[0].length > 5)
      return message.reply('❌ Prefix must be 5 characters or less.');

    if (!s) s = new GuildSettings({ guildId: message.guild.id });
    s.prefix = args[0];
    await s.save();

    message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(0x57F287)
        .setDescription(`✅ Prefix changed to \`${args[0]}\``)
      ]
    });
  }
};
