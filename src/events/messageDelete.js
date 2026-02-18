const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.MessageDelete,
    async execute(message, client) {
        if (!message.guild) return;
        if (message.author?.bot) return;

        const config = client.loggingConfig?.get(message.guild.id);
        if (!config || !config.enabledLogs.messageDelete || !config.actionLogChannel) return;

        // Check if channel is ignored
        if (config.ignoredChannels.includes(message.channel.id)) return;

        const logChannel = message.guild.channels.cache.get(config.actionLogChannel);
        if (!logChannel) return;

        try {
            // Fetch audit logs to find who deleted the message
            const auditLogs = await message.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageDelete,
                limit: 1
            });

            const deleteLog = auditLogs.entries.first();
            let deletedBy = 'Unknown';

            if (deleteLog && deleteLog.target.id === message.author?.id &&
                deleteLog.createdTimestamp > (Date.now() - 5000)) {
                deletedBy = deleteLog.executor;
            } else {
                deletedBy = message.author;
            }

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setAuthor({ 
                    name: 'Message Deleted', 
                    iconURL: message.author?.displayAvatarURL() 
                })
                .addFields(
                    { name: '📝 Author', value: `${message.author}`, inline: true },
                    { name: '📍 Channel', value: `${message.channel}`, inline: true },
                    { name: '🗑️ Deleted By', value: `${deletedBy}`, inline: true }
                )
                .setTimestamp();

            if (message.content) {
                embed.addFields({
                    name: '💬 Content',
                    value: message.content.slice(0, 1024)
                });
            }

            if (message.attachments.size > 0) {
                embed.addFields({
                    name: '📎 Attachments',
                    value: message.attachments.map(a => a.url).join('\n').slice(0, 1024)
                });
            }

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Message delete log error:', error);
        }
    }
};
