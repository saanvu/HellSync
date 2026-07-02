const { EmbedBuilder } = require('discord.js');
const os = require('os');
module.exports = {
  name: 'botinfo', description: 'View bot information', category: 'Information', usage: '.botinfo',
  async execute(message, args, client) {
    const u = process.uptime();
    const uptime = `${Math.floor(u/86400)}d ${Math.floor((u%86400)/3600)}h ${Math.floor((u%3600)/60)}m`;
    message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${client.user.username} — Bot Info`)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: '🤖 Tag',     value: client.user.tag,                                           inline: true },
          { name: '📡 Servers', value: `${client.guilds.cache.size}`,                             inline: true },
          { name: '👥 Users',   value: `${client.users.cache.size}`,                             inline: true },
          { name: '⏱️ Uptime',  value: uptime,                                                    inline: true },
          { name: '📊 Shards',  value: `${client.shard?.count ?? 1}`,                            inline: true },
          { name: '📦 d.js',    value: require('discord.js').version,                            inline: true },
          { name: '💻 Node',    value: process.version,                                          inline: true },
          { name: '🧠 Memory',  value: `${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)} MB`, inline: true },
          { name: '🖥️ OS',      value: `${os.type()} ${os.release()}`,                          inline: true }
        )
        .setFooter({ text: `ID: ${client.user.id}` })
      ]
    });
  }
};