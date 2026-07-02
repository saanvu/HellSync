const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');
module.exports = {
  name: 'settings', description: 'View server bot settings', category: 'Server Settings', usage: '.settings',
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply('❌ You need **Manage Server**.');

    let s = await GuildSettings.findOneAndUpdate(
      { guildId: message.guild.id }, {}, { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    message.channel.send({
      embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`⚙️ ${message.guild.name} — Settings`)
        .addFields(
          { name: 'Prefix',           value: `\`${s.prefix}\``,                                      inline: true },
          { name: 'Level Up Messages',value: s.levelUpMessage ? '✅ On' : '❌ Off',                  inline: true },
          { name: 'Voice Levels',     value: s.voiceLevels    ? '✅ On' : '❌ Off',                  inline: true },
          { name: 'Level Channel',    value: s.levelChannel    ? `<#${s.levelChannel}>` : 'Not set', inline: true },
          { name: 'Ticket Category',  value: s.ticketCategory  ? `<#${s.ticketCategory}>` : 'Not set', inline: true },
          { name: 'Ticket Logs',      value: s.ticketLogChannel? `<#${s.ticketLogChannel}>` : 'Not set', inline: true }
        )
        .setFooter({ text: 'Use dedicated commands to update each setting' })
      ]
    });
  }
};