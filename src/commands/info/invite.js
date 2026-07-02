const { EmbedBuilder } = require('discord.js');
module.exports = {
  name: 'invite', description: 'Get the bot invite link', category: 'Information', usage: '.invite',
  async execute(message, args, client) {
    const url = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    message.channel.send({
      embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setDescription(`📨 [Invite ${client.user.username} to your server](${url})`)
      ]
    });
  }
};