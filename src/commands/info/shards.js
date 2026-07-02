const { EmbedBuilder } = require('discord.js');
module.exports = {
  name: 'shards', description: 'View shard info', category: 'Information', usage: '.shards',
  async execute(message, args, client) {
    message.channel.send({
      embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle('📡 Shard Info')
        .addFields(
          { name: 'Current Shard', value: `\`${message.guild.shardId ?? 0}\``,     inline: true },
          { name: 'Total Shards',  value: `\`${client.shard?.count ?? 1}\``,       inline: true },
          { name: 'WS Ping',       value: `\`${Math.round(client.ws.ping)}ms\``,  inline: true }
        )
      ]
    });
  }
};