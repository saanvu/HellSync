const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Ticket = require('../../models/Ticket');

module.exports = {
  name: 'ticket',
  description: 'Manage tickets',
  category: 'Ticket',
  usage: '.ticket add @user',
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'add') {
      const target = message.mentions.members.first();
      if (!target) return message.reply('❌ Mention a user to add.');

      const ticket = await Ticket.findOne({ channelId: message.channel.id, status: 'open' });
      if (!ticket) return message.reply('❌ This channel is not an open ticket.');

      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
        return message.reply('❌ You need **Manage Channels** to add users to tickets.');

      await message.channel.permissionOverwrites.edit(target.id, {
        ViewChannel:        true,
        SendMessages:       true,
        ReadMessageHistory: true,
      });

      message.channel.send({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setDescription(`✅ Added ${target} to this ticket.`)
        ]
      });
    } else {
      message.reply(`❌ Unknown subcommand. Usage: \`${this.usage}\``);
    }
  }
};