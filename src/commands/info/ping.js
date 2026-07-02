const { EmbedBuilder } = require('discord.js');
module.exports = {
  name: 'ping', description: 'Check bot latency', category: 'Information', usage: '.ping',
  async execute(message, args, client) {
    const sent = await message.channel.send('🏓 Pinging...');
    const ms = sent.createdTimestamp - message.createdTimestamp;
    const color = ms < 100 ? 0x57F287 : ms < 200 ? 0xFEE75C : 0xED4245;
    sent.edit({
      content: null,
      embeds: [new EmbedBuilder().setColor(color).setTitle('🏓 Pong!')
        .addFields(
          { name: 'Message Latency', value: `\`${ms}ms\``, inline: true },
          { name: 'API Latency',     value: `\`${Math.round(client.ws.ping)}ms\``, inline: true }
        )
      ]
    });
  }
};