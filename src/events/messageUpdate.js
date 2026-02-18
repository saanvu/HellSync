const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage, client) {
        if (!newMessage.guild) return;
        if (newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;

        const config = client.loggingConfig?.get(newMessage.guild.id);
        if (!config || !config.enabledLogs.messageEdit || !config.actionLogChannel) return;

        if (config.ignoredChannels.includes(newMessage.channel.id)) return;

        const logChannel = newMessage.guild.channels.cache.get(config.actionLogChannel);
        if (!logChannel) return;

        try {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setAuthor({ 
                    name: 'Message Edited', 
                    iconURL: newMessage.author.displayAvatarURL() 
                })
                .addFields(
                    { name: '📝 Author', value: `${newMessage.author}`, inline: true },
                    { name: '📍 Channel', value: `${newMessage.channel}`, inline: true },
                    { name: '🔗 Jump', value: `[Link](${newMessage.url})`, inline: true },
                    { name: '📜 Before', value: oldMessage.content?.slice(0, 1024) || 'None' },
                    { name: '📝 After', value: newMessage.content?.slice(0, 1024) || 'None' }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Message edit log error:', error);
        }
    }
};
