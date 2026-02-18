const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

module.exports = {
    category: 'Setup',
    name: 'setup',
    description: 'Interactive setup wizard for automod and logging',
    slashOnly: true,

    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Interactive setup wizard for automod and logging')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async executeSlash(interaction) {
        const { client, guild } = interaction;

        // Main menu
        const embed = new EmbedBuilder()
            .setColor(0xFADE13)
            .setTitle('⚙️ HellSync Setup Wizard')
            .setDescription('Welcome to the interactive setup wizard! Choose what you want to configure:')
            .addFields(
                { 
                    name: '🛡️ Automod', 
                    value: 'Configure automatic moderation features like anti-spam, anti-links, bad words filter, etc.', 
                    inline: false 
                },
                { 
                    name: '📋 Logging', 
                    value: 'Set up server logging for messages, members, moderation actions, and more.', 
                    inline: false 
                },
                { 
                    name: '👋 Welcome System', 
                    value: 'Configure welcome messages and auto-role for new members.', 
                    inline: false 
                }
            )
            .setFooter({ text: 'Click a button below to start setup' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('setup-automod')
                .setLabel('🛡️ Automod')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('setup-logging')
                .setLabel('📋 Logging')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('setup-welcome')
                .setLabel('👋 Welcome')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup-cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ 
    embeds: [embed], 
    components: [row]
});
const msg = await interaction.fetchReply();

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ 
                    content: 'Only the user who ran this command can use these buttons!', 
                    flags: [64] 
                });
            }

            switch (i.customId) {
                case 'setup-automod':
                    await setupAutomod(i, client);
                    break;
                case 'setup-logging':
                    await setupLogging(i, client);
                    break;
                case 'setup-welcome':
                    await setupWelcome(i, client);
                    break;
                case 'setup-cancel':
                    await i.update({ 
                        embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Setup Cancelled')], 
                        components: [] 
                    });
                    collector.stop();
                    break;
            }
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};

// ========== AUTOMOD SETUP ==========
async function setupAutomod(interaction, client) {
    const { guild } = interaction;

    const steps = [
        { key: 'antiSpam', label: '🚫 Anti-Spam', description: 'Block spam messages' },
        { key: 'antiLinks', label: '🔗 Anti-Links', description: 'Block unauthorized links' },
        { key: 'antiCaps', label: '🔠 Anti-Caps', description: 'Prevent excessive caps' },
        { key: 'badWords', label: '🤬 Bad Words Filter', description: 'Filter inappropriate words' },
        { key: 'antiMentions', label: '📢 Anti-Mention Spam', description: 'Prevent mention spam' }
    ];

    let currentStep = 0;
    const config = {
        antiSpam: { enabled: false },
        antiLinks: { enabled: false },
        antiCaps: { enabled: false },
        badWords: { enabled: false, words: [] },
        antiMentions: { enabled: false }
    };

    await showAutomodStep(interaction, currentStep, steps, config, client);
}

async function showAutomodStep(interaction, stepIndex, steps, config, client) {
    if (stepIndex >= steps.length) {
        // Save and finish
        if (!client.automodConfig) client.automodConfig = new Map();
        client.automodConfig.set(interaction.guild.id, config);

        const summary = Object.entries(config)
            .map(([key, val]) => `${steps.find(s => s.key === key)?.label} - ${val.enabled ? '✅ Enabled' : '❌ Disabled'}`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ Automod Configuration Complete!')
            .setDescription('Your automod settings have been saved successfully.')
            .addFields({
                name: '📊 Summary',
                value: summary
            })
            .setFooter({ text: 'Use /automod to manage settings anytime' })
            .setTimestamp();

        return interaction.update({ embeds: [embed], components: [] });
    }

    const step = steps[stepIndex];
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`⚙️ Automod Setup - Step ${stepIndex + 1}/${steps.length}`)
        .setDescription(`**${step.label}**\n${step.description}\n\nDo you want to enable this feature?`)
        .setFooter({ text: `Progress: ${stepIndex + 1}/${steps.length}` })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`automod-yes-${stepIndex}`)
            .setLabel('✅ Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`automod-no-${stepIndex}`)
            .setLabel('❌ No')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('automod-skip')
            .setLabel('⏭️ Skip All')
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [row] });

    const filter = (i) => i.user.id === interaction.user.id && i.customId.startsWith('automod-');
    const collector = interaction.message.createMessageComponentCollector({
        filter,
        time: 60000,
        max: 1
    });

    collector.on('collect', async (i) => {
        if (i.customId === 'automod-skip') {
            // Save current config and finish
            if (!client.automodConfig) client.automodConfig = new Map();
            client.automodConfig.set(interaction.guild.id, config);

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ Automod Setup Skipped')
                .setDescription('Setup has been completed with current selections.')
                .setTimestamp();

            return i.update({ embeds: [embed], components: [] });
        }

        const enabled = i.customId.startsWith('automod-yes');
        config[step.key].enabled = enabled;

        await showAutomodStep(i, stepIndex + 1, steps, config, client);
    });

    collector.on('end', (collected) => {
        if (collected.size === 0) {
            interaction.editReply({ components: [] }).catch(() => {});
        }
    });
}

// ========== LOGGING SETUP ==========
async function setupLogging(interaction, client) {
    const { guild } = interaction;

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📋 Logging Setup')
        .setDescription('I will now create logging channels for your server. Please wait...')
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

    try {
        // Create logging category
        const category = await guild.channels.create({
            name: '📋 Server Logs',
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['SendMessages', 'AddReactions']
                }
            ]
        });

        // Create log channels
        const actionLog = await guild.channels.create({
            name: '📝-action-logs',
            type: ChannelType.GuildText,
            parent: category.id,
            topic: 'Message deletes, edits, and other server actions'
        });

        const modLog = await guild.channels.create({
            name: '🔨-mod-logs',
            type: ChannelType.GuildText,
            parent: category.id,
            topic: 'Moderation actions: bans, kicks, warns, timeouts'
        });

        const joinLog = await guild.channels.create({
            name: '👋-join-leave-logs',
            type: ChannelType.GuildText,
            parent: category.id,
            topic: 'Member joins and leaves'
        });

        // Configure logging
        if (!client.loggingConfig) client.loggingConfig = new Map();
        
        client.loggingConfig.set(guild.id, {
            actionLogChannel: actionLog.id,
            modLogChannel: modLog.id,
            joinLogChannel: joinLog.id,
            ignoredChannels: [],
            ignoredRoles: [],
            enabledLogs: {
                messageDelete: true,
                messageEdit: true,
                messageBulkDelete: true,
                memberJoin: true,
                memberLeave: true,
                memberBan: true,
                memberUnban: true,
                memberKick: true,
                nicknameChange: true,
                roleUpdate: true,
                channelCreate: true,
                channelDelete: true,
                channelUpdate: true,
                voiceState: true
            }
        });

        const successEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ Logging Setup Complete!')
            .setDescription(`Successfully created logging channels in ${category}`)
            .addFields(
                { name: '📝 Action Log', value: `${actionLog}`, inline: true },
                { name: '🔨 Mod Log', value: `${modLog}`, inline: true },
                { name: '👋 Join/Leave Log', value: `${joinLog}`, inline: true }
            )
            .setFooter({ text: 'All log types are enabled by default. Use /logs toggle to customize.' })
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error('Logging setup error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Logging Setup Failed')
            .setDescription('Failed to create logging channels. Make sure I have Manage Channels permission!')
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

// ========== WELCOME SETUP ==========
async function setupWelcome(interaction, client) {
    const { guild } = interaction;

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('👋 Welcome System Setup')
        .setDescription('Select the channel where welcome messages should be sent:')
        .setFooter({ text: 'This will also configure auto-role if needed' })
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

    await interaction.followUp({
        content: '🔍 Please mention a channel for welcome messages (e.g., #welcome)',
        flags: [64]
    });

    const filter = (m) => m.author.id === interaction.user.id && m.mentions.channels.size > 0;
    const collected = await interaction.channel.awaitMessages({
        filter,
        max: 1,
        time: 60000,
        errors: ['time']
    }).catch(() => null);

    if (!collected) {
        return interaction.followUp({
            content: '❌ Welcome setup timed out!',
            flags: [64]
        });
    }

    const welcomeChannel = collected.first().mentions.channels.first();

    // Ask about auto-role
    const roleEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎭 Auto-Role Configuration')
        .setDescription('Do you want to automatically assign a role to new members?')
        .setTimestamp();

    const roleRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('welcome-autorole-yes')
            .setLabel('✅ Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('welcome-autorole-no')
            .setLabel('❌ No')
            .setStyle(ButtonStyle.Danger)
    );

    const roleMsg = await interaction.followUp({
        embeds: [roleEmbed],
        components: [roleRow],
        fetchReply: true
    });

    const roleCollector = roleMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        max: 1
    });

    roleCollector.on('collect', async (i) => {
        if (i.customId === 'welcome-autorole-yes') {
            await i.update({
                content: '🔍 Please mention the role to auto-assign (e.g., @Member)',
                embeds: [],
                components: []
            });

            const roleFilter = (m) => m.author.id === interaction.user.id && m.mentions.roles.size > 0;
            const roleCollected = await interaction.channel.awaitMessages({
                filter: roleFilter,
                max: 1,
                time: 60000,
                errors: ['time']
            }).catch(() => null);

            if (roleCollected) {
                const role = roleCollected.first().mentions.roles.first();
                
                if (!client.autoroleConfig) client.autoroleConfig = new Map();
                client.autoroleConfig.set(guild.id, {
                    roleId: role.id,
                    enabled: true
                });

                const finalEmbed = new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('✅ Welcome System Configured!')
                    .setDescription('Your welcome system has been set up successfully.')
                    .addFields(
                        { name: '👋 Welcome Channel', value: `${welcomeChannel}`, inline: true },
                        { name: '🎭 Auto-Role', value: `${role}`, inline: true }
                    )
                    .setTimestamp();

                await interaction.followUp({ embeds: [finalEmbed] });
            }
        } else {
            const finalEmbed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ Welcome System Configured!')
                .setDescription('Your welcome system has been set up successfully.')
                .addFields(
                    { name: '👋 Welcome Channel', value: `${welcomeChannel}`, inline: true },
                    { name: '🎭 Auto-Role', value: 'Not configured', inline: true }
                )
                .setTimestamp();

            await i.update({ embeds: [finalEmbed], components: [] });
        }
    });
}
