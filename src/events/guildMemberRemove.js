const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        const config = client.loggingConfig?.get(member.guild.id);
        if (!config || !config.enabledLogs.memberLeave || !config.joinLogChannel) return;

        const logChannel = member.guild.channels.cache.get(config.joinLogChannel);
        if (!logChannel) return;

        try {
            // Check if it was a kick
            const auditLogs = await member.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberKick,
                limit: 1
            });

            const kickLog = auditLogs.entries.first();
            const wasKicked = kickLog && 
                            kickLog.target.id === member.id && 
                            kickLog.createdTimestamp > (Date.now() - 5000);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setAuthor({ 
                    name: wasKicked ? 'Member Kicked' : 'Member Left', 
                    iconURL: member.user.displayAvatarURL() 
                })
                .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                .addFields(
                    { name: '👤 User', value: `${member}`, inline: true },
                    { name: '🆔 ID', value: member.id, inline: true },
                    { name: '📊 Member Count', value: `${member.guild.memberCount}`, inline: true }
                )
                .setTimestamp();

            if (wasKicked) {
                embed.addFields({
                    name: '👮 Kicked By',
                    value: `${kickLog.executor}`,
                    inline: true
                });
            }

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Member leave log error:', error);
        }
    }
};
