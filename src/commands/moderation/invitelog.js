const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    category: 'Moderation',
    name: 'invitelog',
    description: 'Configure invite logging channel',
    slashOnly: false,

    data: new SlashCommandBuilder()
        .setName('invitelog')
        .setDescription('Configure invite logging channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the invite log channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for invite logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove the invite log channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current invite log channel'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async executePrefix(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply({ content: 'You need Manage Server permission to use this command!', flags: [64] });
        }

        const subcommand = args[0]?.toLowerCase();

        // Initialize invite log config if not exists
        if (!client.inviteLogChannels) {
            client.inviteLogChannels = new Map();
        }

        const currentChannel = client.inviteLogChannels.get(message.guild.id);

        if (!subcommand || subcommand === 'view') {
            if (!currentChannel) {
                return message.reply({ content: '❌ No invite log channel is currently configured.', flags: [64] });
            }

            const channel = message.guild.channels.cache.get(currentChannel);
            if (!channel) {
                return message.reply({ content: '❌ The configured channel no longer exists!', flags: [64] });
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📊 Invite Log Configuration')
                .setDescription(`Invite logs are being sent to ${channel}`)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        if (subcommand === 'set') {
            const channel = message.mentions.channels.first();
            if (!channel) {
                return message.reply({ content: 'Please mention a channel to set as invite log!', flags: [64] });
            }

            if (channel.type !== ChannelType.GuildText) {
                return message.reply({ content: '❌ Please select a text channel!', flags: [64] });
            }

            client.inviteLogChannels.set(message.guild.id, channel.id);

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ Invite Log Channel Set!')
                .setDescription(`Invite logs will now be sent to ${channel}`)
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        if (subcommand === 'remove') {
            if (!currentChannel) {
                return message.reply({ content: '❌ No invite log channel is currently configured!', flags: [64] });
            }

            client.inviteLogChannels.delete(message.guild.id);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🗑️ Invite Log Channel Removed')
                .setDescription('Invite logging has been disabled.')
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        return message.reply({ content: 'Invalid subcommand! Use: `set`, `remove`, or `view`', flags: [64] });
    },

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Initialize invite log config if not exists
        if (!interaction.client.inviteLogChannels) {
            interaction.client.inviteLogChannels = new Map();
        }

        const currentChannel = interaction.client.inviteLogChannels.get(interaction.guild.id);

        if (subcommand === 'view') {
            if (!currentChannel) {
                return interaction.reply({ content: '❌ No invite log channel is currently configured.', flags: [64] });
            }

            const channel = interaction.guild.channels.cache.get(currentChannel);
            if (!channel) {
                return interaction.reply({ content: '❌ The configured channel no longer exists!', flags: [64] });
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📊 Invite Log Configuration')
                .setDescription(`Invite logs are being sent to ${channel}`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'set') {
            const channel = interaction.options.getChannel('channel');

            if (channel.type !== ChannelType.GuildText) {
                return interaction.reply({ content: '❌ Please select a text channel!', flags: [64] });
            }

            interaction.client.inviteLogChannels.set(interaction.guild.id, channel.id);

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ Invite Log Channel Set!')
                .setDescription(`Invite logs will now be sent to ${channel}`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'remove') {
            if (!currentChannel) {
                return interaction.reply({ content: '❌ No invite log channel is currently configured!', flags: [64] });
            }

            interaction.client.inviteLogChannels.delete(interaction.guild.id);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🗑️ Invite Log Channel Removed')
                .setDescription('Invite logging has been disabled.')
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    }
};
